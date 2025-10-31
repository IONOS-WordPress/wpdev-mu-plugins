import { UpdatePostStatusConfirm } from '@agent/workflows/content/components/UpdatePostStatusConfirm';

const { context, abilities } = window.extAgentData;

export default {
	available: () =>
		abilities?.canEditPosts && !context?.adminPage && context?.postId,
	id: 'update-post-status',
	whenFinished: { component: UpdatePostStatusConfirm },
};
