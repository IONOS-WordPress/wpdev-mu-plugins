import { uploadMedia } from '@wordpress/media-utils';
import { getOption, updateOption } from '@launch/api/WPApi';
import { uploadLogo } from '@launch/lib/logo';

// Mock the dependencies
jest.mock('@wordpress/media-utils', () => ({
	uploadMedia: jest.fn(),
}));

jest.mock('@launch/api/WPApi', () => ({
	getOption: jest.fn(),
	updateOption: jest.fn(),
}));

describe('uploadLogo', () => {
	// Setup and teardown
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();

		// Mock the fetch function
		global.fetch = jest.fn();
		global.File = class File {
			constructor(bits, name, options) {
				this.bits = bits;
				this.name = name;
				this.type = options?.type || '';
			}
		};
	});

	afterEach(() => {
		// Restore fetch after each test
		global.fetch.mockRestore();
		delete global.File;
	});

	it('should not upload logo if one already exists', async () => {
		// Mock existing logo
		getOption.mockResolvedValue('123');

		await uploadLogo('https://example.com/logo.png');

		// Verify getOption was called
		expect(getOption).toHaveBeenCalledWith('site_logo');

		// Verify no other operations were performed
		expect(global.fetch).not.toHaveBeenCalled();
		expect(uploadMedia).not.toHaveBeenCalled();
		expect(updateOption).not.toHaveBeenCalled();
	});

	it('should handle fetch errors gracefully', async () => {
		// Mock no existing logo
		getOption.mockResolvedValue('0');

		// Mock fetch failure
		global.fetch.mockResolvedValue({
			ok: false,
			text: () => Promise.resolve('Not found'),
		});

		console.error = jest.fn();

		await uploadLogo('https://example.com/logo.png');

		// Verify error was logged
		expect(console.error).toHaveBeenCalled();
		expect(uploadMedia).not.toHaveBeenCalled();
	});

	it('should successfully upload a logo when none exists', async () => {
		// Mock no existing logo
		getOption.mockResolvedValue('0');

		// Mock successful fetch
		const mockBlob = new Blob(['test'], { type: 'image/png' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		// Mock successful media upload
		uploadMedia.mockImplementation(({ onFileChange }) => {
			onFileChange([{ id: '456' }]);
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/logo.png');

		// Verify the workflow
		expect(getOption).toHaveBeenCalledWith('site_logo');
		expect(global.fetch).toHaveBeenCalledWith('https://example.com/logo.png');
		expect(uploadMedia).toHaveBeenCalled();
		expect(updateOption).toHaveBeenCalledWith('site_logo', '456');
	});

	it('should handle upload errors gracefully', async () => {
		// Mock no existing logo
		getOption.mockResolvedValue('0');

		// Mock successful fetch
		const mockBlob = new Blob(['test'], { type: 'image/png' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		// Mock error in upload
		console.error = jest.fn();
		uploadMedia.mockImplementation(({ onError }) => {
			onError(new Error('Upload failed'));
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/logo.png');

		// Verify error was handled
		expect(console.error).toHaveBeenCalled();
	});

	it('should force upload even if logo already exists when forceReplace is true', async () => {
		getOption.mockResolvedValue('123');

		const mockBlob = new Blob(['test'], { type: 'image/png' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		uploadMedia.mockImplementation(({ onFileChange }) => {
			onFileChange([{ id: '789' }]);
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/logo.png', { forceReplace: true });

		expect(getOption).toHaveBeenCalledWith('site_logo');
		expect(global.fetch).toHaveBeenCalledWith('https://example.com/logo.png');
		expect(uploadMedia).toHaveBeenCalled();
		expect(updateOption).toHaveBeenCalledWith('site_logo', '789');
	});

	it('should upload logo with webp format correctly', async () => {
		getOption.mockResolvedValue('0');
		const mockBlob = new Blob(['test'], { type: 'image/webp' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		const FileSpy = jest.fn(function (bits, name, options) {
			this.name = name;
			this.type = options?.type;
			return this;
		});
		global.File = FileSpy;

		uploadMedia.mockImplementation(({ onFileChange }) => {
			onFileChange([{ id: '100' }]);
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/logo.webp');
		expect(FileSpy).toHaveBeenCalledWith(
			expect.anything(),
			expect.stringMatching(/^ext-custom-logo-\d+\.webp$/),
			expect.objectContaining({ type: 'image/webp' }),
		);
	});

	it('should log error for unsupported MIME types like jpeg', async () => {
		getOption.mockResolvedValue('0');
		const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		await uploadLogo('https://example.com/logo.jpg');

		expect(errorSpy).toHaveBeenCalledWith(
			'Error uploading logo: ',
			expect.any(Error),
		);
		expect(errorSpy.mock.calls[0][1].message).toMatch(/Unsupported image type/);
		expect(uploadMedia).not.toHaveBeenCalled();

		errorSpy.mockRestore();
	});

	it('should generate dynamic filename with correct extension', async () => {
		getOption.mockResolvedValue('0');
		const mockBlob = new Blob(['test'], { type: 'image/avif' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		const FileSpy = jest.fn(function (bits, name, options) {
			this.name = name;
			this.type = options?.type;
			return this;
		});
		global.File = FileSpy;

		uploadMedia.mockImplementation(({ onFileChange }) => {
			onFileChange([{ id: '200' }]);
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/blob-url', {
			mimeType: 'image/avif',
		});

		expect(FileSpy).toHaveBeenCalledWith(
			expect.anything(),
			expect.stringMatching(/^ext-custom-logo-\d+\.avif$/),
			expect.objectContaining({ type: 'image/avif' }),
		);
	});

	it('should not call updateOption if fileObj.id is falsy', async () => {
		getOption.mockResolvedValue('0');
		const mockBlob = new Blob(['test'], { type: 'image/png' });
		global.fetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(mockBlob),
		});

		uploadMedia.mockImplementation(({ onFileChange }) => {
			onFileChange([{}]);
			return Promise.resolve();
		});

		await uploadLogo('https://example.com/logo.png');

		expect(updateOption).not.toHaveBeenCalled();
	});
});
