import { getSiteQuestions } from '@launch/api/DataApi';

const fallback = { questions: [] };
const originalFetch = global.fetch;
const mockUseUserSelectionStore = {
  getState: jest.fn(),
};

describe('getSiteQuestions', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.window = Object.create(window);
    global.window.extSharedData = { wpLanguage: 'en' };
    mockUseUserSelectionStore.getState.mockReturnValue({
      businessInformation: { description: 'My business' },
      siteObjective: 'Grow',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns fallback when siteProfile is falsy', async () => {
    const result = await getSiteQuestions({ siteProfile: null });
    expect(result).toEqual(fallback);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns parsed data when fetch succeeds', async () => {
    const mockData = { questions: ['Q1', 'Q2'] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockData,
    });

    const result = await getSiteQuestions({ siteProfile: { id: 1 } });
    expect(result).toEqual(mockData.questions);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback when first fetch throws and second fetch returns not ok', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: false });

    const result = await getSiteQuestions({ siteProfile: { id: 1 } });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fallback when both fetch attempts throw', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Still failing'));

    const result = await getSiteQuestions({ siteProfile: { id: 1 } });
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

    const result = await getSiteQuestions({ siteProfile: { id: 1 } });
    expect(result).toEqual(fallback);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

	it('returns fallback when response ok=false (retries by design)', async () => {
		global.fetch.mockResolvedValueOnce({ ok: false });

		const result = await getSiteQuestions({ siteProfile: { id: 1 } });
		expect(result).toEqual(fallback);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it('returns fallback when fetch resolves undefined (retries by design)', async () => {
		global.fetch.mockResolvedValueOnce(undefined);

		const result = await getSiteQuestions({ siteProfile: { id: 1 } });
		expect(result).toEqual(fallback);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});
});
