import { getSiteStyles } from '@launch/api/DataApi';

const fallback = [];
const originalFetch = global.fetch;
global.Request = class Request {
  constructor(input, init) {
    this.input = input;
    this.init = init;
  }
};

describe('getSiteStyles', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns parsed JSON when fetch succeeds with valid data', async () => {
    const mockResponse = [{ color: '#000' }, { color: '#fff' }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockResponse,
    });

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when first fetch throws and second returns not ok', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: false });

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when both fetch attempts throw', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Still failing'));

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when response is ok but JSON parsing fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when response ok=false without throwing (no retry by design)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when fetch resolves with undefined', async () => {
    global.fetch.mockResolvedValueOnce(undefined);

    const result = await getSiteStyles({ title: 'My Site', siteProfile: {} });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
