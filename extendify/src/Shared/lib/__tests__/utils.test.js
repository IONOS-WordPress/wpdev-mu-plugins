import { isObject, deepMerge, sleep } from '@shared/lib/utils';

describe('isObject', () => {
	it('returns true for plain objects', () => {
		expect(isObject({})).toBe(true);
		expect(isObject({ a: 1 })).toBe(true);
	});

	it('returns false for arrays', () => {
		expect(isObject([])).toBe(false);
	});

	it('returns false for null', () => {
		expect(isObject(null)).toBe(false);
	});

	it('returns false for other types', () => {
		expect(isObject(42)).toBe(false);
		expect(isObject('string')).toBe(false);
		expect(isObject(undefined)).toBe(false);
	});
});

describe('deepMerge', () => {
	it('merges two flat objects', () => {
		const result = deepMerge({ a: 1 }, { b: 2 });
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it('merges deeply nested objects', () => {
		const result = deepMerge({ a: { x: 1 }, b: 2 }, { a: { y: 3 }, c: 4 });
		expect(result).toEqual({ a: { x: 1, y: 3 }, b: 2, c: 4 });
	});

	it('overwrites non-object values', () => {
		const result = deepMerge({ a: 1 }, { a: 2 });
		expect(result).toEqual({ a: 2 });
	});

	it('returns null if any input is not an object', () => {
		expect(deepMerge(null, { a: 1 })).toBeNull();
		expect(deepMerge({ a: 1 }, 123)).toBeNull();
	});
});

describe('sleep', () => {
	it('resolves after given time', async () => {
		const start = Date.now();
		await sleep(50);
		const duration = Date.now() - start;
		expect(duration).toBeGreaterThanOrEqual(49);
	});
});
