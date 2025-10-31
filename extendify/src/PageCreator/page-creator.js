import { useEffect } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import '@page-creator/app.css';
import { MainButton } from '@page-creator/components/MainButton';
import { Modal } from '@page-creator/components/Modal';
import { render } from '@shared/lib/dom';
import { hasPageCreatorEnabled } from '@help-center/lib/utils';

const isPageCreatorEnabled = () => {
	return (
		hasPageCreatorEnabled &&
		window.wp.data.select('core/editor').getCurrentPostType() === 'page'
	);
};

registerPlugin('extendify-page-creator-buttons', {
	render: () => <AICreatePageButton />,
});

const AICreatePageButton = () => {
	useEffect(() => {
		if (!isPageCreatorEnabled()) return;

		const id = 'extendify-page-creator-btn';
		const className = 'extendify-page-creator';
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

				const mdl = 'extendify-page-creator-modal';
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
