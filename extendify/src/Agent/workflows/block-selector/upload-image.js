import { UpdateImageConfirm } from '@agent/workflows/block-selector/components/UpdateImageConfirm';

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
	id: 'block-upload-image',
	requires: ['block'],
	whenFinished: { component: UpdateImageConfirm },
};
