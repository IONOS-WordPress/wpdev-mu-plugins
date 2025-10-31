import { useEffect, useRef, useState } from '@wordpress/element';

const id = 'global-styles-inline-css';
const path = window.location.pathname;
const s = new URLSearchParams(window.location.search);
const onEditor =
	path.includes('/wp-admin/post.php') && s.get('action') === 'edit';

export const useFontVariationOverride = ({ css }) => {
	const frontStyles = useRef(null);
	const [theDocument, setDocument] = useState(null);

	useEffect(() => {
		if (!css || onEditor) return;
		const style = document.getElementById(id);
		if (!style) return;
		if (!frontStyles.current) {
			frontStyles.current = style.innerHTML;
		}
		style.innerHTML = css;
	}, [css]);

	// Handle the editor
	useEffect(() => {
		if (!css || !theDocument || !onEditor) return;
		const style = theDocument.getElementById(id);
		const hasIframe = document.querySelector('iframe[name="editor-canvas"]');
		style.innerHTML = css.replaceAll(
			':root',
			// If the iframe was removed, target the editor the old way
			hasIframe ? ':root' : '.editor-styles-wrapper',
		);

		// Since these effects should not affect the whole editor, only the text
		if (!hasIframe) {
			// we need to replace the individual elements with the style wrapper
			style.innerHTML = style.innerHTML
				.replace('body{', '.editor-styles-wrapper{')
				// or prefix them with the editor class
				.replace(
					/(h[1-6](?:\s*,\s*h[1-6])*)\s*\{/g,
					'.editor-styles-wrapper $1{',
				);
		}
	}, [css, theDocument]);

	useEffect(() => {
		if (theDocument) return;
		const timer = setTimeout(() => {
			if (theDocument) return;
			const frame = document.querySelector('iframe[name="editor-canvas"]');
			const doc = frame?.contentDocument || document;
			if (!doc || !doc.body) return;
			// Add a tag to the body
			const newStyle = doc.createElement('style');
			newStyle.id = id;
			doc.body.appendChild(newStyle);
			setDocument(doc);
		}, 300); // wait for iframe
		return () => clearTimeout(timer);
	}, [theDocument]);

	return {
		undoChange: () => {
			// Revert CSS changes
			const style = document.getElementById(id);
			if (style && frontStyles.current) {
				style.innerHTML = frontStyles.current;
			}

			// Remove editor CSS
			if (!onEditor) return;
			const iframe = document.querySelector('iframe[name="editor-canvas"]');
			const doc = iframe?.contentDocument || document;
			doc?.getElementById(id)?.remove();
		},
	};
};
