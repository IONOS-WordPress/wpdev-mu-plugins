import { getSiteImages } from '@launch/api/DataApi';

jest.mock(
	'./getSiteImages.deps',
	() => ({
		IMAGES_HOST: 'https://img.example.com',
		extraBody: { foo: 'bar', baz: 'qux' },
		useUserSelectionStore: {
			getState: jest.fn(() => ({ siteInformation: { title: 'My Site' } })),
		},
	}),
	{ virtual: true },
);

const makeResponse = (ok, body) => ({
	ok,
	json: async () => body,
});

describe('getSiteImages', () => {
	const originalFetch = global.fetch;
	const originalAbortSignal = global.AbortSignal;

	beforeEach(() => {
		jest.resetAllMocks();

		global.fetch = jest.fn();
		global.AbortSignal = {
			...originalAbortSignal,
			timeout: jest.fn((ms) => ({ __fakeTimeoutSignal: true, ms })),
		};
	});

	afterEach(() => {
		global.fetch = originalFetch;
		global.AbortSignal = originalAbortSignal;
	});

	test('returns fallback when response.ok = false', async () => {
		global.fetch.mockResolvedValueOnce(makeResponse(false, {}));

		const data = await getSiteImages({
			aiSiteType: 'x',
			aiSiteCategory: 'y',
			aiDescription: 'z',
			aiKeywords: 'k',
		});

		expect(data).toEqual({ siteImages: [] });
	});

	test('returns fallback when json() throws an error (invalid body)', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => {
				throw new Error('invalid json');
			},
		});

		const data = await getSiteImages({
			aiSiteType: 'x',
			aiSiteCategory: 'y',
			aiDescription: 'z',
			aiKeywords: 'k',
		});

		expect(data).toEqual({ siteImages: [] });
	});

	test('handles first timeout → retries → succeeds', async () => {
		global.fetch
			.mockRejectedValueOnce(new Error('AbortError: The operation was aborted'))
			.mockResolvedValueOnce(makeResponse(true, { siteImages: ['ok.jpg'] }));

		const data = await getSiteImages({
			aiSiteType: 'x',
			aiSiteCategory: 'y',
			aiDescription: 'z',
			aiKeywords: 'k',
		});

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(data).toEqual({ siteImages: ['ok.jpg'] });

		expect(global.AbortSignal.timeout).toHaveBeenCalledTimes(2);
		expect(global.AbortSignal.timeout).toHaveBeenNthCalledWith(1, 10000);
		expect(global.AbortSignal.timeout).toHaveBeenNthCalledWith(2, 10000);
	});

	test('handles first timeout → second timeout → returns fallback', async () => {
		global.fetch
			.mockRejectedValueOnce(new Error('AbortError: timeout 1'))
			.mockRejectedValueOnce(new Error('AbortError: timeout 2'));

		const data = await getSiteImages({
			aiSiteType: 'x',
			aiSiteCategory: 'y',
			aiDescription: 'z',
			aiKeywords: 'k',
		});

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(data).toEqual({ siteImages: [] });
	});

	test('returns fallback when response body lacks siteImages', async () => {
		global.fetch.mockResolvedValueOnce(makeResponse(true, { whatever: 123 }));

		const data = await getSiteImages({
			aiSiteType: 'x',
			aiSiteCategory: 'y',
			aiDescription: 'z',
			aiKeywords: 'k',
		});

		expect(data).toEqual({ siteImages: [] });
	});
});
