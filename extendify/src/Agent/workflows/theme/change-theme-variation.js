import { RedirectThemeVariations } from '@agent/components/redirects/RedirectThemeVariations';
import { SelectThemeVariation } from '@agent/workflows/theme/components/SelectThemeVariation';

const { context, abilities } = window.extAgentData;

export default {
	available: () => abilities?.canEditThemes && context?.hasThemeVariations,
	needsRedirect: () => !Number(context?.postId || 0),
	redirectComponent: RedirectThemeVariations,
	id: 'change-theme-variation',
	whenFinished: {
		component: SelectThemeVariation,
	},
};
