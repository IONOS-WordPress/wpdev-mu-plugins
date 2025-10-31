import { getSiteProfile } from '@launch/api/DataApi';

const fallback = {
  aiSiteType: null,
  aiSiteCategory: null,
  aiDescription: null,
  aiKeywords: [],
  logoObjectName: null,
};

const originalFetch = global.fetch;

describe('getSiteProfile', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns parsed JSON when fetch succeeds', async () => {
    const mockResponse = {
      aiSiteType: 'portfolio',
      aiSiteCategory: 'creative',
      aiDescription: 'test',
      aiKeywords: ['design'],
      logoObjectName: 'logo.png',
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockResponse,
    });

    const result = await getSiteProfile({ title: 'My Site', description: 'Desc' });
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when first fetch fails and second fetch throws', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Still failing'));

    const result = await getSiteProfile({ title: 'My Site', description: 'Desc' });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when both fetches succeed but response not ok', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: false });

    const result = await getSiteProfile({ title: 'My Site', description: 'Desc' });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when JSON parse fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await getSiteProfile({ title: 'My Site', description: 'Desc' });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when fetch resolves with undefined', async () => {
    global.fetch.mockResolvedValueOnce(undefined);
    const result = await getSiteProfile({ title: 'My Site', description: 'Desc' });
    expect(result).toEqual(fallback);
  });
});
