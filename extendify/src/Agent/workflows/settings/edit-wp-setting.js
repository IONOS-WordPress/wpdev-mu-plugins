import { UpdateSettingConfirm } from '@agent/workflows/settings/components/UpdateSettingConfirm';

const { abilities } = window.extAgentData;

export const allowedSettings = [
	'posts_per_page',
	'use_smilies',
	'start_of_week',
	'time_format',
	'date_format',
	'title',
	'description',
];
export default {
	available: () => abilities?.canEditSettings,
	id: 'edit-wp-setting',
	whenFinished: { component: UpdateSettingConfirm },
};
