import { GenerateImageConfirm } from '@agent/workflows/block-selector/components/GenerateImageConfirm';

const { context, abilities } = window.extAgentData;

export default {
	available: () =>
		abilities?.canEditPosts &&
		abilities?.canUploadMedia &&
		!context?.adminPage &&
		context?.postId &&
		!context?.isBlogPage &&
		context?.isBlockTheme &&
		document.querySelector('.wp-site-blocks'),
	id: 'block-generate-image',
	requires: ['block'],
	whenFinished: { component: GenerateImageConfirm },
};
