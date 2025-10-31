// resize-image.test.js
import { resizeImage } from '@shared/utils/resize-image';

describe('resizeImage', () => {
	beforeEach(() => {
		Object.defineProperty(global.Image.prototype, 'src', {
			set() {
				setTimeout(() => {
					this.width = 500;
					this.height = 500;
					this.onload();
				}, 10);
			},
		});

		HTMLCanvasElement.prototype.getContext = () => ({
			clearRect: jest.fn(),
			drawImage: jest.fn(),
		});

		HTMLCanvasElement.prototype.toBlob = function (callback, type) {
			callback(new Blob(['mock'], { type }));
		};

		global.URL.createObjectURL = jest.fn(
			() => 'blob:http://example.com/fake-url',
		);
	});

	afterEach(() => {
		delete global.URL.createObjectURL;
	});

	it('should resize image and return a blob URL', async () => {
		const result = await resizeImage('http://example.com/img.png', {
			size: { width: 64, height: 64 },
			mimeType: 'image/png',
		});

		expect(typeof result).toBe('string');
		expect(result).toBe('blob:http://example.com/fake-url');
		expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
	});

	it('should throw if imageUrl is missing', async () => {
		await expect(
			resizeImage(null, { width: 64, height: 64 }, 'image/png'),
		).rejects.toThrow('Invalid imageUrl or size dimensions');
	});

	it('should throw if size is missing', async () => {
		await expect(resizeImage('http://example.com/img.png', {})).rejects.toThrow(
			'Invalid imageUrl or size dimensions',
		);
	});

	it('should throw if size is not an object', async () => {
		await expect(
			resizeImage('http://example.com/img.png', 64, 'image/png'),
		).rejects.toThrow('Invalid imageUrl or size dimensions');
	});

	it('should throw if width or height are not valid numbers', async () => {
		await expect(
			resizeImage('http://example.com/img.png', { width: 0, height: 64 }),
		).rejects.toThrow('Invalid imageUrl or size dimensions');

		await expect(
			resizeImage('http://example.com/img.png', { width: 64, height: -1 }),
		).rejects.toThrow('Invalid imageUrl or size dimensions');

		await expect(
			resizeImage('http://example.com/img.png', { width: '64', height: 64 }),
		).rejects.toThrow('Invalid imageUrl or size dimensions');
	});
});
