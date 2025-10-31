import { getUrlParameter } from '@shared/utils/get-url-parameter';

describe('getUrlParameter', () => {
	beforeEach(() => {
		delete global.window.location;
		global.window = Object.create(window);
	});

	it('should return null if parameter does not exist', () => {
		global.window.location = { search: '?param1=value1' };

		expect(getUrlParameter('param2')).toBeNull();
	});

	it('should return the correct parameter value from URL', () => {
		global.window.location = { search: '?param1=value1&param2=value2' };

		expect(getUrlParameter('param1')).toBe('value1');
		expect(getUrlParameter('param2')).toBe('value2');
	});

	it('should not modify safe values', () => {
		global.window.location = { search: '?param1=SafeValue' };

		expect(getUrlParameter('param1')).toBe('SafeValue');
	});

	it('should sanitize the parameter value before returning', () => {
		global.window.location = {
			search: '?param1=<script>alert("XSS")</script>',
		};

		expect(getUrlParameter('param1')).toBe('alert("XSS")');
	});

	it('should correctly handle special characters in parameters', () => {
		global.window.location = { search: '?param1=Hello%20World' };

		expect(getUrlParameter('param1')).toBe('Hello World');
	});

	it('should cleanup the parameter in url after use', () => {
		global.window.location = { pathname: '/', search: '?param1=Hello%20World' };
		const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

		getUrlParameter('param1');

		expect(replaceStateSpy).toHaveBeenCalledWith({}, document.title, '/');
		replaceStateSpy.mockRestore();
	});

	it('should NOT cleanup the parameter in url if cleanUrl is false', () => {
		global.window.location = { pathname: '/', search: '?param1=Hello%20World' };
		const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

		getUrlParameter('param1', false);

		expect(replaceStateSpy).not.toHaveBeenCalled();
		replaceStateSpy.mockRestore();
	});

	it('should NOT affect other parameters in url when cleanup', () => {
		global.window.location = {
			pathname: '/',
			search: '?param1=Hello%20World&other=keep-it',
		};
		const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

		getUrlParameter('param1');

		expect(replaceStateSpy).toHaveBeenCalledWith(
			{},
			document.title,
			'/?other=keep-it',
		);
		replaceStateSpy.mockRestore();
	});
});
