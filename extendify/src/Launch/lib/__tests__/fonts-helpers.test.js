import {
	fetchFontFaceFile,
	makeFontFamilyFormData,
	makeFontFaceFormData,
} from '@launch/lib/fonts-helpers';

jest.mock('@shared/lib/utils', () => ({
	sleep: jest.fn(() => Promise.resolve()),
}));

global.fetch = jest.fn();

describe('fetchFontFaceFile', () => {
	const mockBlob = new Blob(['font-data'], { type: 'font/woff2' });

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches font and returns a File object', async () => {
		fetch.mockResolvedValueOnce({
			ok: true,
			blob: () => mockBlob,
		});

		const file = await fetchFontFaceFile('https://fonts.com/my-font.woff2');
		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('my-font.woff2');
		expect(file.type).toBe('font/woff2');
	});
});

describe('makeFontFamilyFormData', () => {
	it('creates FormData with font_family_settings', () => {
		const formData = makeFontFamilyFormData({
			name: 'Roboto',
			slug: 'roboto',
			fontFamily: 'Roboto, sans-serif',
		});

		const entry = formData.get('font_family_settings');
		expect(JSON.parse(entry)).toEqual({
			name: 'Roboto',
			slug: 'roboto',
			fontFamily: 'Roboto, sans-serif',
		});
	});
});

describe('makeFontFaceFormData', () => {
	it('creates FormData with correct file and settings', () => {
		const mockFile = new File(['abc'], 'roboto.woff2', { type: 'font/woff2' });

		const formData = makeFontFaceFormData({
			fontFamilySlug: 'roboto',
			fontFamily: 'Roboto',
			fontStyle: 'normal',
			fontWeight: '400',
			fontDisplay: 'swap',
			file: mockFile,
		});

		const fontSettings = JSON.parse(formData.get('font_face_settings'));

		expect(fontSettings).toMatchObject({
			fontFamily: 'Roboto',
			fontStyle: 'normal',
			fontWeight: '400',
			fontDisplay: 'swap',
			src: ['roboto-400-normal'],
		});

		const fileData = formData.get('roboto-400-normal');
		expect(fileData).toBeInstanceOf(File);
		expect(fileData.name).toBe('roboto.woff2');
	});
});
