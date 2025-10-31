import { UpdatePostConfirm } from '@agent/workflows/content/components/UpdatePostConfirm';

const { context, abilities } = window.extAgentData;

export default {
	available: () =>
		abilities?.canEditPosts &&
		!context?.adminPage &&
		context?.postId &&
		!context?.isBlogPage &&
		context.usingBlockEditor,
	id: 'edit-post-strings',
	whenFinished: { component: UpdatePostConfirm },
};
