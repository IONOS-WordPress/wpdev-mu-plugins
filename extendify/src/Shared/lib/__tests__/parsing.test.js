import { safeParseJson } from '@shared/lib/parsing';

describe('safeParseJson', () => {
	it('parses valid JSON string', () => {
		const json = '{"name": "Test", "active": true}';
		const result = safeParseJson(json);
		expect(result).toEqual({ name: 'Test', active: true });
	});

	it('returns empty object for invalid JSON', () => {
		const json = '{name: Test,}';
		const result = safeParseJson(json);
		expect(result).toEqual({});
	});

	it('returns empty object for empty string', () => {
		const result = safeParseJson('');
		expect(result).toEqual({});
	});

	it('returns empty object for null', () => {
		const result = safeParseJson(null);
		expect(result).toEqual({});
	});

	it('returns empty object for undefined', () => {
		const result = safeParseJson(undefined);
		expect(result).toEqual({});
	});
});
