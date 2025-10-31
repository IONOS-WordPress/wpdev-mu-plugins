import { formatSiteQuestionsForAPI } from '@shared/utils/format-site-questions-for-api';
import { usePagesSelectionStore } from '@launch/state/pages-selections';
import { useUserSelectionStore } from '@launch/state/user-selections';

export const buildRecommendedPagesParams = () => {
	const {
		siteType,
		siteStructure,
		siteStrings,
		siteImages,
		siteQA,
		sitePlugins,
	} = useUserSelectionStore?.getState() || {};
	const {
		style: { siteStyle },
	} = usePagesSelectionStore.getState();
	return {
		key: 'pages-list',
		siteType,
		siteStructure,
		siteStrings,
		siteImages,
		siteStyle,
		siteQuestions: formatSiteQuestionsForAPI(siteQA),
		sitePlugins,
	};
};
