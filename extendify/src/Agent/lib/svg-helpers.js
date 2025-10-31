import { colord } from 'colord';

const doc =
	document.querySelector('iframe[name="editor-canvas"]')?.contentDocument ||
	document;

const SVGFeFunc = ['feFuncR', 'feFuncG', 'feFuncB'];

export const replaceDuotoneSVG = (() => {
	let originalStates = new Map();

	const processSingleDuotone = (slug, duotoneTheme, dynamicDuotone) => {
		let dynamicSlug = '';
		if (!isNaN(slug)) {
			dynamicSlug = slug;
			slug = dynamicDuotone?.[`wp-duotone-${dynamicSlug}`];
		}

		// Extract duotone colors from theme settings for the specified slug
		const colors = duotoneTheme?.find((item) => item.slug === slug)?.colors;

		// Duotone requires exactly 2 colors (dark and light)
		if (!colors || colors.length !== 2) return false;

		// Find the SVG filter element in the DOM (WordPress generates these)
		const element =
			doc.querySelector(`#wp-duotone-${dynamicSlug}`) ||
			doc.querySelector(`#wp-duotone-${slug}`);

		if (!element) return false;

		// Capture the original state only once per slug
		if (!originalStates.has(dynamicSlug || slug)) {
			const originalState = {
				tableValues: {},
				cssProperty: getComputedStyle(doc.documentElement).getPropertyValue(
					`--wp--preset--duotone--${dynamicSlug || slug}`,
				),
			};

			// Store original tableValues for each filter function element
			SVGFeFunc.forEach((func) => {
				const funcElement = element.querySelector(func);
				if (funcElement) {
					originalState.tableValues[func] =
						funcElement.getAttribute('tableValues');
				}
			});

			originalStates.set(dynamicSlug || slug, originalState);
		}

		// Convert hex colors to normalized RGB values (0-1 range for SVG filters)
		const [darkColor, lightColor] = colors.map((hex) => {
			const { r, g, b } = colord(hex).toRgb();
			return { r: r / 255, g: g / 255, b: b / 255 };
		});

		// Update SVG filter function elements for each color channel
		// WordPress duotone filters use feFuncR/G/B elements with tableValues
		// that map original color values to new duotone colors
		SVGFeFunc.forEach((func, index) => {
			const component = ['r', 'g', 'b'][index];
			const funcElement = element.querySelector(func);
			if (funcElement) {
				// Set tableValues to map from dark to light color for this channel
				// Format: "darkValue lightValue" (SVG filter table lookup)
				funcElement.setAttribute(
					'tableValues',
					`${darkColor[component]} ${lightColor[component]}`,
				);
			}
		});

		// Update the CSS custom property so WordPress can reference the updated filter
		doc.documentElement.style.setProperty(
			`--wp--preset--duotone--${dynamicSlug || slug}`,
			`url(#wp-duotone-${dynamicSlug || slug})`,
		);

		return true;
	};

	return ({ duotoneTheme, dynamicDuotone }) => {
		const processedSlugs = [];

		// Auto-detect and process all duotone filters
		const duotoneElements = doc.querySelectorAll('[id^="wp-duotone-"]');

		duotoneElements.forEach((element) => {
			const detectedSlug = element.id.replace('wp-duotone-', '');
			if (processSingleDuotone(detectedSlug, duotoneTheme, dynamicDuotone)) {
				processedSlugs.push(detectedSlug);
			}
		});

		// Return the cleanup function directly
		return processedSlugs.length > 0
			? () => {
					processedSlugs.forEach((processedSlug) => {
						const originalState = originalStates.get(processedSlug);
						if (!originalState) return;

						const currentElement = doc.querySelector(
							`#wp-duotone-${processedSlug}`,
						);
						if (!currentElement) return;

						// Restore original tableValues for each filter function element
						SVGFeFunc.forEach((func) => {
							const funcElement = currentElement.querySelector(func);
							if (funcElement && originalState.tableValues[func] !== null) {
								if (originalState.tableValues[func]) {
									funcElement.setAttribute(
										'tableValues',
										originalState.tableValues[func],
									);
								} else {
									funcElement.removeAttribute('tableValues');
								}
							}
						});

						// Restore original CSS custom property
						if (originalState.cssProperty) {
							doc.documentElement.style.setProperty(
								`--wp--preset--duotone--${processedSlug}`,
								originalState.cssProperty,
							);
						} else {
							doc.documentElement.style.removeProperty(
								`--wp--preset--duotone--${processedSlug}`,
							);
						}
					});
				}
			: null;
	};
})();
