import {
	convertToValidParamsArray,
	convertToValidParamsString,
	mapToneValuesToObjects,
} from '@shared/utils/convert-to-valid-params';

const ALLOWED = [
	{ label: 'Professional', value: 'professional' },
	{ label: 'Friendly', value: 'friendly' },
];

describe('convertToValidParamsArray', () => {
	const allowed = ['info', 'pages', 'layout'];

	test('returns empty array if params is null', () => {
		expect(convertToValidParamsArray(null, allowed)).toEqual([]);
	});

	test('returns empty array if allowedItems is empty', () => {
		expect(convertToValidParamsArray('info', [])).toEqual([]);
	});

	test('filters out values not in allowed list', () => {
		expect(convertToValidParamsArray('info,invalid', allowed)).toEqual([
			'info',
		]);
	});

	test('removes duplicates', () => {
		expect(convertToValidParamsArray('info,info,pages', allowed)).toEqual([
			'info',
			'pages',
		]);
	});

	test('trims spaces around values', () => {
		expect(convertToValidParamsArray(' info , pages ', allowed)).toEqual([
			'info',
			'pages',
		]);
	});

	test('returns empty array if none are valid', () => {
		expect(convertToValidParamsArray('foo,bar', allowed)).toEqual([]);
	});
});

describe('convertToValidParamsString', () => {
	const allowed = ['info', 'pages', 'layout'];

	test('returns empty string if params is null', () => {
		expect(convertToValidParamsString(null, allowed)).toBe('');
	});

	test('returns single valid item as string', () => {
		expect(convertToValidParamsString('info', allowed)).toBe('info');
	});

	test('returns multiple valid items joined by comma', () => {
		expect(convertToValidParamsString('info,pages', allowed)).toBe(
			'info,pages',
		);
	});

	test('filters out invalid values', () => {
		expect(convertToValidParamsString('info,unknown', allowed)).toBe('info');
	});

	test('removes duplicates', () => {
		expect(convertToValidParamsString('info,info,pages', allowed)).toBe(
			'info,pages',
		);
	});

	test('trims spaces around values', () => {
		expect(convertToValidParamsString(' info , pages ', allowed)).toBe(
			'info,pages',
		);
	});
});

describe('mapToneValuesToObjects', () => {
	it('returns [] for null, undefined or empty array', () => {
		expect(mapToneValuesToObjects(null, ALLOWED)).toEqual([]);
		expect(mapToneValuesToObjects(undefined, ALLOWED)).toEqual([]);
		expect(mapToneValuesToObjects([], ALLOWED)).toEqual([]);
	});

	it('maps valid values to objects', () => {
		expect(mapToneValuesToObjects(['professional'], ALLOWED)).toEqual([
			{ label: 'Professional', value: 'professional' },
		]);
	});

	it('ignores invalid values', () => {
		expect(mapToneValuesToObjects(['x', 'friendly'], ALLOWED)).toEqual([
			{ label: 'Friendly', value: 'friendly' },
		]);
	});

	it('keeps order and duplicates', () => {
		expect(
			mapToneValuesToObjects(
				['friendly', 'professional', 'professional'],
				ALLOWED,
			),
		).toEqual([
			{ label: 'Friendly', value: 'friendly' },
			{ label: 'Professional', value: 'professional' },
			{ label: 'Professional', value: 'professional' },
		]);
	});
});
