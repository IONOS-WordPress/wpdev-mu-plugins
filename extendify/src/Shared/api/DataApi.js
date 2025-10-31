import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { AI_HOST, INSIGHTS_HOST } from '@constants';
import { extraBody } from '@shared/lib/extra-body';
import { useImageGenerationStore } from '@shared/state/generate-images';

export const generateImage = async (imageData, signal) => {
	const response = await fetch(`${AI_HOST}/api/draft/image`, {
		method: 'POST',
		mode: 'cors',
		headers: { 'Content-Type': 'application/json' },
		signal: signal,
		body: JSON.stringify({
			...imageData,
			globalState: useImageGenerationStore.getState(),
			...extraBody,
		}),
	});

	const body = await response.json();

	const imageCredits = {
		remaining: response.headers.get('x-ratelimit-remaining'),
		total: response.headers.get('x-ratelimit-limit'),
		refresh: response.headers.get('x-ratelimit-reset'),
	};

	if (!response.ok) {
		if (body.status && body.status === 'content-policy-violation') {
			throw {
				message: __(
					'Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.',
					'extendify-local',
				),
				imageCredits,
			};
		}
		throw {
			message: __('Service temporarily unavailable', 'extendify-local'),
			imageCredits,
		};
	}
	return {
		images: body,
		imageCredits,
		id: response.headers.get('x-request-id'),
	};
};

export const recordPluginActivity = async ({
	slug,
	source,
	action = 'install', //eslint-disable-line no-unused-vars
}) => {
	try {
		const res = await fetch(`${INSIGHTS_HOST}/api/v1/plugin-install`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Extendify': 'true' },
			body: JSON.stringify({
				...extraBody,
				slug,
				source,
				siteCreatedAt: window.extSharedData?.siteCreatedAt,
			}),
		});

		// this should not break the app.
		if (!res.ok) {
			console.error('Bad response from server');
			return null;
		}

		return await res.json();
	} catch (error) {
		console.error('Error sending plugin installation notification:', error);
		return null;
	}
};

export const pingServer = async () =>
	await apiFetch({ path: '/extendify/v1/shared/ping' });

export const getPartnerPlugins = async (key) => {
	const plugins = await apiFetch({
		path: '/extendify/v1/shared/partner-plugins',
	});
	if (!Object.keys(plugins?.data ?? {}).length) {
		throw new Error('Could not get plugins');
	}
	if (key && plugins.data?.[key]) {
		return plugins.data[key];
	}
	return plugins.data;
};
