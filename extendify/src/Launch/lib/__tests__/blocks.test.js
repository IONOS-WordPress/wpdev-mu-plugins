import { addIdAttributeToBlock } from '@launch/lib/blocks';

describe('addIdAttributeToBlock', () => {
	const blockCode = '<div class="wp-block-group something">Content</div>';

	it('adds id attribute to block with wp-block-group class', () => {
		const result = addIdAttributeToBlock(blockCode, 'test-id');
		expect(result).toContain('id="test-id"');
	});

	it('does not break other parts of the HTML', () => {
		const result = addIdAttributeToBlock(blockCode, 'unique-id');
		expect(result).toContain(
			'<div class="wp-block-group something" id="unique-id">',
		);
	});

	it('does nothing if blockCode doesn’t match the expected pattern', () => {
		const input = '<div class="something-else">Hello</div>';
		const result = addIdAttributeToBlock(input, 'abc');
		expect(result).toBe(input);
	});
});
