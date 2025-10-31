import { __ } from '@wordpress/i18n';
import { RedirectFontsVariations } from '@agent/workflows/theme/components/RedirectFontsVariations';
import { SelectThemeFontsVariation } from '@agent/workflows/theme/components/SelectThemeFontsVariation';

const { context, abilities } = window.extAgentData;

export default {
	available: () => abilities?.canEditThemes && context?.hasThemeVariations,
	needsRedirect: () => !Number(context?.postId || 0),
	redirectComponent: () =>
		RedirectFontsVariations(
			__(
				'Hey there! It looks like you are trying to change your theme fonts, but you are not on a page where we can do that.',
				'extendify-local',
			),
		),
	id: 'change-theme-fonts-variation',
	whenFinished: {
		component: SelectThemeFontsVariation,
	},
};
