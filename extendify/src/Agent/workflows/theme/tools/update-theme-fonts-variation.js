import apiFetch from '@wordpress/api-fetch';

// variation here should be added to the payload by the custom component
const id = window.extSharedData.globalStylesPostID;
export default ({ variation }) =>
	apiFetch({
		method: 'POST',
		path: `/wp/v2/global-styles/${id}`,
		data: {
			id,
			settings: variation.settings,
			styles: variation.styles,
		},
	});
