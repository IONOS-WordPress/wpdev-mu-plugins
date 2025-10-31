import { mergeRequiredPlugins } from '@shared/utils/merge-required-plugins';

describe('mergeRequiredPlugins', () => {
	beforeEach(() => {
		global.window = {};
	});

	test('returns suggested plugins when requiredPlugins is missing', () => {
		window.extSharedData = {};
		const ai = [
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'B', wordpressSlug: 'b' },
		];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual(ai);
		expect(result).toBe(ai);
	});

	test('returns suggested plugins when requiredPlugins is not an array', () => {
		window.extSharedData = { requiredPlugins: 'not-an-array' };
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual(ai);
	});

	test('returns suggested plugins when requiredPlugins is an empty array', () => {
		window.extSharedData = { requiredPlugins: [] };
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual(ai);
	});

	test('adds required plugin when it is missing from suggested list', () => {
		window.extSharedData = {
			requiredPlugins: [{ name: 'Req1', wordpressSlug: 'req-1' }],
		};
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual([
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'Req1', wordpressSlug: 'req-1' },
		]);
	});

	test('adds multiple required plugins that are missing from suggested list', () => {
		window.extSharedData = {
			requiredPlugins: [
				{ name: 'Req1', wordpressSlug: 'req-1' },
				{ name: 'Req2', wordpressSlug: 'req-2' },
			],
		};
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual([
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'Req1', wordpressSlug: 'req-1' },
			{ name: 'Req2', wordpressSlug: 'req-2' },
		]);
	});

	test('does not duplicate required plugin if it already exists in suggested list', () => {
		window.extSharedData = {
			requiredPlugins: [
				{ name: 'Req1', wordpressSlug: 'req-1' },
				{ name: 'A', wordpressSlug: 'a' },
			],
		};
		const ai = [
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'B', wordpressSlug: 'b' },
		];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual([
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'B', wordpressSlug: 'b' },
			{ name: 'Req1', wordpressSlug: 'req-1' },
		]);
	});

	test('keeps order: suggested plugins first, then required ones', () => {
		window.extSharedData = {
			requiredPlugins: [
				{ name: 'Req1', wordpressSlug: 'req-1' },
				{ name: 'Req2', wordpressSlug: 'req-2' },
			],
		};
		const ai = [
			{ name: 'Sug1', wordpressSlug: 'sug-1' },
			{ name: 'Sug2', wordpressSlug: 'sug-2' },
		];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual([
			{ name: 'Sug1', wordpressSlug: 'sug-1' },
			{ name: 'Sug2', wordpressSlug: 'sug-2' },
			{ name: 'Req1', wordpressSlug: 'req-1' },
			{ name: 'Req2', wordpressSlug: 'req-2' },
		]);
	});

	test('does not mutate the original suggested list', () => {
		window.extSharedData = {
			requiredPlugins: [{ name: 'Req1', wordpressSlug: 'req-1' }],
		};
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const snapshotBefore = [...ai];
		const result = mergeRequiredPlugins(ai);

		expect(ai).toEqual(snapshotBefore);
		expect(result).not.toBe(ai);
	});

	test('handles required plugin without wordpressSlug (current behavior)', () => {
		window.extSharedData = {
			requiredPlugins: [
				{ name: 'NoSlug' },
				{ name: 'Req1', wordpressSlug: 'req-1' },
			],
		};
		const ai = [{ name: 'A', wordpressSlug: 'a' }];

		const result = mergeRequiredPlugins(ai);

		expect(result).toEqual([
			{ name: 'A', wordpressSlug: 'a' },
			{ name: 'NoSlug', wordpressSlug: undefined },
			{ name: 'Req1', wordpressSlug: 'req-1' },
		]);
	});
});
