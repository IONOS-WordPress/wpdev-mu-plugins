import * as element from '@wordpress/element';
import { render } from '@shared/lib/dom';

jest.mock('@wordpress/element', () => ({
	render: jest.fn(),
	createRoot: undefined,
}));

describe('render (fallback)', () => {
	it('falls back to renderDeprecated if createRoot is not available', () => {
		const dummyComponent = 'div';
		const dummyNode = document.createElement('div');

		render(dummyComponent, dummyNode);

		expect(element.render).toHaveBeenCalledWith(dummyComponent, dummyNode);
	});
});
