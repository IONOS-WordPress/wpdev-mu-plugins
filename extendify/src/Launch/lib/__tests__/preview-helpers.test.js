import { getFontOverrides } from '@launch/lib/preview-helpers';

describe('getFontOverrides', () => {
	it('returns empty strings if no title is provided', () => {
		const result = getFontOverrides({});
		expect(result).toEqual({ customFontLinks: '', fontOverrides: '' });
	});

	it('returns fontOverrides for heading and body font variables', () => {
		const variation = {
			title: 'My Variation',
			styles: {
				elements: {
					heading: {
						typography: {
							fontFamily: 'var(--wp--preset--font-family--custom-heading)',
						},
					},
				},
				typography: {
					fontFamily: 'var(--wp--preset--font-family--custom-body)',
				},
			},
		};

		const { fontOverrides } = getFontOverrides(variation);

		expect(fontOverrides).toContain('--wp--preset--font-family--heading');
		expect(fontOverrides).toContain('--wp--preset--font-family--body');
		expect(fontOverrides).toContain(
			'font-family: var(--wp--preset--font-family--custom-heading)',
		);
		expect(fontOverrides).toContain(
			'font-family: var(--wp--preset--font-family--custom-body)',
		);
	});

	it('generates link tags and root variables for custom fonts', () => {
		const variation = {
			title: 'My Variation',
			settings: {
				typography: {
					fontFamilies: {
						custom: [
							{
								slug: 'myfont',
								css: 'https://fonts.com/myfont.css',
								fontFamily: 'MyFont',
							},
							{
								slug: 'myfont-bold',
								css: 'https://fonts.com/myfont-bold.css',
								fontFamily: 'MyFont Bold',
							},
						],
					},
				},
			},
		};

		const { customFontLinks, fontOverrides } = getFontOverrides(variation);

		expect(customFontLinks).toContain('<link id="ext-custom-font-myfont"');
		expect(customFontLinks).toContain('href="https://fonts.com/myfont.css"');
		expect(customFontLinks).toContain('<link id="ext-custom-font-myfont-bold"');

		expect(fontOverrides).toContain('--wp--preset--font-family--myfont');
		expect(fontOverrides).toContain('--wp--preset--font-family--myfont-bold');
		expect(fontOverrides).toContain(':root');
		expect(fontOverrides).toContain('"MyFont Bold"');
	});

	it('avoids duplicate font links and overrides', () => {
		const variation = {
			title: 'My Variation',
			settings: {
				typography: {
					fontFamilies: {
						custom: [
							{
								slug: 'myfont',
								css: 'https://fonts.com/myfont.css',
								fontFamily: 'MyFont',
							},
							{
								slug: 'myfont',
								css: 'https://fonts.com/myfont.css',
								fontFamily: 'MyFont',
							},
						],
					},
				},
			},
		};

		const { customFontLinks, fontOverrides } = getFontOverrides(variation);

		expect(customFontLinks.match(/myfont\.css/g)).toHaveLength(1);
		expect(
			fontOverrides.match(/--wp--preset--font-family--myfont/g),
		).toHaveLength(1);
	});
});
