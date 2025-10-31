import { getSiteLogo } from '@launch/api/DataApi';

const fallbackUrl =
	'https://images.extendify-cdn.com/demo-content/logos/ext-custom-logo-default.webp';

const originalFetch = global.fetch;

describe('getSiteLogo', () => {
	beforeEach(() => {
		global.fetch = jest.fn();

		Object.defineProperty(global, 'window', {
			value: {
				extSharedData: {
					siteId: 'test-site',
					partnerId: 'test-partner',
					showAILogo: true,
				},
			},
			writable: true,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
		global.fetch = originalFetch;
	});

	it('returns logoUrl on successful fetch and valid JSON', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => ({ logoUrl: 'https://cdn/image.png' }),
		});

		const result = await getSiteLogo('test-logo');
		expect(result).toBe('https://cdn/image.png');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('returns fallback when showAILogo is false', async () => {
		global.window.extSharedData = {
			siteId: 'test-site',
			partnerId: 'test-partner',
			showAILogo: false,
		};

		const result = await getSiteLogo('test-logo');
		expect(result).toBe(fallbackUrl);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('throws error when required parameters are missing', async () => {
		global.window.extSharedData = {
			siteId: '',
			partnerId: 'test-partner',
			showAILogo: true,
		};

		await expect(getSiteLogo('test-logo')).rejects.toThrow(
			'Missing required parameter (siteId, partnerId or objectName)',
		);
	});

	it('returns fallback on failed fetch and retry (non-ok response)', async () => {
		global.fetch
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValueOnce({ ok: false });

		const result = await getSiteLogo('test-logo');
		expect(result).toBe(fallbackUrl);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it('returns fallback on JSON parse error', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => {
				throw new Error('Invalid JSON');
			},
		});

		const result = await getSiteLogo('test-logo');
		expect(result).toBe(fallbackUrl);
	});

	describe('returns fallback when objectName is falsy', () => {
		it('returns fallback when objectName is null', async () => {
			const result = await getSiteLogo(null);
			expect(result).toBe(fallbackUrl);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('returns fallback when objectName is undefined', async () => {
			const result = await getSiteLogo(undefined);
			expect(result).toBe(fallbackUrl);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('returns fallback when objectName is an empty string', async () => {
			const result = await getSiteLogo('');
			expect(result).toBe(fallbackUrl);
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});
});
