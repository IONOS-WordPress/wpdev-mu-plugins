import { createRoot } from '@wordpress/element';
import { useEffect } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { render } from '@shared/lib/dom';
import { MainButton } from '@library/components/MainButton';
import { Modal } from '@library/components/Modal';
import '@library/library.css';

registerPlugin('extendify-library', {
	render: () => <LibraryButton />,
});

const LibraryButton = () => {
	useEffect(() => {
		if (typeof createRoot !== 'function') return;

		const id = 'extendify-library-btn';
		const className = 'extendify-library';
		const page = '.edit-post-header-toolbar';
		const fse = '.edit-site-header-edit-mode__start';
		if (document.getElementById(id)) return;

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (document.getElementById(id)) return;
				const btnWrap = document.createElement('div');
				const btn = Object.assign(btnWrap, { id, className });
				document.querySelector(page)?.append(btn);
				document.querySelector(fse)?.append(btn);
				render(<MainButton />, btn);

				const mdl = 'extendify-library-modal';
				if (document.getElementById(mdl)) return;
				const modalWrap = document.createElement('div');
				const modal = Object.assign(modalWrap, { id: mdl, className });
				document.body.append(modal);
				render(<Modal />, modal);
			});
		});
	}, []);
	return null;
};
