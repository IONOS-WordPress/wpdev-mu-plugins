// Optionally add items to request body
const allowList = [
	'partnerId',
	'devbuild',
	'version',
	'siteId',
	'wpLanguage',
	'wpVersion',
	'siteProfile',
];

export const extraBody = {
	...Object.fromEntries(
		Object.entries(window.extSharedData).filter(([key]) =>
			allowList.includes(key),
		),
	),
};
