import apiFetch from '@wordpress/api-fetch';
import * as wpAPI from '@shared/api/wp';

jest.mock('@wordpress/api-fetch');

describe('WordPress Plugin API helpers', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('getPlugin calls correct endpoint', async () => {
		apiFetch.mockResolvedValueOnce([{ name: 'test-plugin' }]);

		const result = await wpAPI.getPlugin('test-plugin');
		expect(apiFetch).toHaveBeenCalledWith({
			path: '/wp/v2/plugins?search=test-plugin',
		});
		expect(result).toEqual({ name: 'test-plugin' });
	});

	it('installPlugin calls correct POST endpoint', async () => {
		apiFetch.mockResolvedValueOnce({ success: true });

		const result = await wpAPI.installPlugin('my-plugin');
		expect(apiFetch).toHaveBeenCalledWith({
			path: '/wp/v2/plugins',
			method: 'POST',
			data: { slug: 'my-plugin' },
		});
		expect(result).toEqual({ success: true });
	});

	it('activatePlugin calls correct POST endpoint', async () => {
		apiFetch.mockResolvedValueOnce([{ name: 'plugin-x' }]);
		apiFetch.mockResolvedValueOnce({ activated: true });

		const result = await wpAPI.activatePlugin('plugin-x');
		expect(apiFetch).toHaveBeenCalledTimes(2);
		expect(result).toEqual({ activated: true });
	});
});
