import { serialize, rawHandler } from '@wordpress/blocks';

export const walkAndUpdateImageDetails = (inputs, newImage) => {
	const blocks = rawHandler({ HTML: inputs.previousContent });
	const parser = new DOMParser();
	const walk = (blocks) =>
		blocks.map((block) => {
			if (['core/image', 'core/cover'].includes(block.name)) {
				const attrs = { ...block.attributes };
				const url = inputs.url.includes('unsplash.com')
					? inputs.url.split('?')[0] // For unsplash just match the base URL
					: inputs.url;
				const isMatchingId = attrs.id === inputs.imageId;
				const isMatchingUrl = attrs.url.startsWith(url);
				if (!isMatchingId && !isMatchingUrl) {
					// Not our image, return as is
					return { ...block, attributes: attrs };
				}
				attrs.url = newImage.source_url || newImage.url;
				attrs.id = newImage.id;
				// Remove import class if present
				if (attrs.className) {
					attrs.className = attrs.className
						.split(' ')
						.filter((cn) => cn !== 'extendify-image-import')
						.join(' ');
				}
				// originalContent needs wp-image-{id} to match the new ID
				const originalContentDoc = parser.parseFromString(
					attrs.originalContent || block.originalContent || '',
					'text/html',
				);
				const img = originalContentDoc.querySelector('img');
				if (!img) return { ...block, attributes: attrs };
				// cover block wont have an image here
				img.setAttribute('src', newImage.source_url || newImage.url);
				const classList = img.className
					.split(' ')
					.filter((cn) => cn !== `wp-image-${inputs.imageId}`);
				classList.push(`wp-image-${newImage.id}`);
				img.className = classList.join(' ');
				attrs.originalContent = originalContentDoc.body.innerHTML;

				return { ...block, attributes: attrs };
			}
			if (block.innerBlocks && block.innerBlocks.length > 0) {
				return {
					...block,
					innerBlocks: walk(block.innerBlocks),
				};
			}
			return block;
		});
	const updatedBlocks = walk(blocks);
	return serialize(updatedBlocks);
};
