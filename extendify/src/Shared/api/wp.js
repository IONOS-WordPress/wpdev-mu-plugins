import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { AI_HOST } from '@constants';

export const getPlugin = async (slug) => {
	const response = await apiFetch({
		path: addQueryArgs('/wp/v2/plugins', { search: slug }),
	});

	let plugin = response?.[0];

	if (!plugin) throw new Error('Plugin not found');

	return plugin;
};

export const getAllPlugins = async () => {
	const response = await apiFetch({
		path: '/wp/v2/plugins',
	});

	if (!response) {
		throw new Error('Failed to fetch installed plugins');
	}

	return response;
};

export const installPlugin = async (slug) => {
	return await apiFetch({
		path: '/wp/v2/plugins',
		method: 'POST',
		data: {
			slug,
		},
	});
};

export const activatePlugin = async (slug) => {
	const plugin = await getPlugin(slug);

	return await apiFetch({
		path: `/wp/v2/plugins/${plugin.plugin}`,
		method: 'POST',
		data: {
			status: 'active',
		},
	});
};

export const loadImage = (img) => {
	return new Promise((resolve, reject) => {
		img.onload = () => resolve(img);
		img.onerror = (e) => reject(e);
	});
};

export const importImage = async (imageUrl, metadata = {}) => {
	const image = new Image();
	image.src = imageUrl;
	image.crossOrigin = 'anonymous';
	await loadImage(image);

	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	ctx.drawImage(image, 0, 0);

	const blob = await new Promise((resolve) => {
		canvas.toBlob((blob) => {
			blob && resolve(blob);
		}, 'image/jpeg');
	});

	const formData = new FormData();
	formData.append('file', new File([blob], metadata.filename));
	formData.append('alt_text', metadata.alt ?? '');
	formData.append('caption', metadata.caption ?? '');
	formData.append('status', 'publish');

	return await apiFetch({
		path: 'wp/v2/media',
		method: 'POST',
		body: formData,
	});
};

export const importImageServer = async (src, metadata = {}) => {
	const formData = new FormData();
	formData.append('source', src);
	// Fallback doesn't support custom file_name
	formData.append('alt_text', metadata.alt ?? '');
	formData.append('caption', metadata.caption ?? '');

	return await apiFetch({
		path: '/extendify/v1/draft/upload-image',
		method: 'POST',
		body: formData,
	});
};

export const downloadImage = async (
	id,
	src,
	source,
	unsplashId,
	metadata = { alt: '', caption: '' },
) => {
	let image;
	if (unsplashId) {
		await downloadPing(id, source, { unsplashId });
	}
	try {
		image = await importImage(src, {
			alt: metadata.alt,
			filename: 'image.jpg',
			caption: metadata.caption,
		});
	} catch (_e) {
		image = await importImageServer(src, {
			alt: metadata.alt,
			filename: 'image.jpg',
			caption: metadata.caption,
		});
	}

	return image;
};

export const downloadPing = (id, source, details = {}) =>
	fetch(`${AI_HOST}/api/draft/image/download`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id, source, ...details }),
	});
