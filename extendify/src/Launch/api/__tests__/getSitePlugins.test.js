import { getSitePlugins } from '@launch/api/DataApi';
import { mergeRequiredPlugins } from '@shared/utils/merge-required-plugins';

const mockUseUserSelectionStore = {
  getState: jest.fn(),
};
const originalFetch = global.fetch;

describe('getSitePlugins (no mock de mergeRequiredPlugins)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    Object.defineProperty(global, 'window', {
      value: {
        extSharedData: {
          wpLanguage: 'en',
          partnerId: 'partner-123',
          pluginGroupId: 'group-xyz',
        },
      },
      writable: true,
    });
		mockUseUserSelectionStore.getState.mockReturnValue({
      businessInformation: { description: 'My business' },
      siteObjective: 'Grow',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns merged plugins on successful fetch with valid JSON', async () => {
    const apiSelected = ['a', 'b'];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ selectedPlugins: apiSelected }),
    });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    const expected = mergeRequiredPlugins(apiSelected);
    expect(result).toEqual(expected);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when siteProfile is falsy (no fetch)', async () => {
    const result = await getSitePlugins({ siteProfile: null, siteQA: [] });

    const expectedFallback = mergeRequiredPlugins([]);
    expect(result).toEqual(expectedFallback);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('retries when first fetch throws (network) and second returns ok -> returns merged plugins', async () => {
    const apiSelected = ['x'];
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ selectedPlugins: apiSelected }),
      });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins(apiSelected));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries when first response is not ok; returns merged plugins if second is ok', async () => {
    const apiSelected = ['p'];
    global.fetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ selectedPlugins: apiSelected }),
      });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });
    expect(result).toEqual(mergeRequiredPlugins(apiSelected));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when both fetch attempts throw', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Still failing'));

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins([]));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when second fetch resolves but not ok', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: false });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins([]));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when response is ok but JSON parsing fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins([]));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when response ok=true but payload has no selectedPlugins', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({}),
    });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins([]));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when first fetch resolves undefined (retries by design)', async () => {
    global.fetch
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ ok: false });

    const result = await getSitePlugins({ siteProfile: { id: 1 }, siteQA: [] });

    expect(result).toEqual(mergeRequiredPlugins([]));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
