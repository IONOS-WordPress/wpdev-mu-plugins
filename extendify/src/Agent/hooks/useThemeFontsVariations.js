import useSWRImmutable from 'swr/immutable';
import fetcher from '@agent/workflows/theme/tools/get-theme-fonts-variations';

export const useThemeFontsVariations = () => {
	const { data, error, isLoading } = useSWRImmutable(
		{
			key: 'theme-fonts-variations',
			themeSlug: window.extAgentData.context.themeSlug,
		},
		fetcher,
	);
	return { variations: data?.variations, error, isLoading };
};
