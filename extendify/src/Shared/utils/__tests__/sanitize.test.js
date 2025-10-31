import { sanitizeString } from '@shared/utils/sanitize';

describe('sanitizeString', () => {
	it('should return an empty string if input is null or undefined', () => {
		expect(sanitizeString(null)).toBe('');
		expect(sanitizeString(undefined)).toBe('');
		expect(sanitizeString('')).toBe('');
	});

	it('should not modify safe HTML content', () => {
		const safeHtml = '<p>Hello, <b>World</b>!</p>';
		expect(sanitizeString(safeHtml)).toBe(safeHtml);
	});

	it('should remove disallowed HTML tags', () => {
		const dirtyHtml = '<script>alert("XSS")</script><p>Secure text</p>';
		expect(sanitizeString(dirtyHtml)).toBe('alert("XSS")<p>Secure text</p>');
	});

	it('should remove multiple disallowed tags', () => {
		const dirtyHtml =
			'<iframe src="http://malicious.com"></iframe><meta><style>body{background:red;}</style><p>Ok</p>';
		expect(sanitizeString(dirtyHtml)).toBe('body{background:red;}<p>Ok</p>');
	});

	it('should remove JavaScript URLs', () => {
		const dirtyHtml = '<a href="javascript:alert(\'XSS\')">Click here</a>';
		expect(sanitizeString(dirtyHtml)).toBe(
			'<a href="alert(\'XSS\')">Click here</a>',
		);
	});
});
