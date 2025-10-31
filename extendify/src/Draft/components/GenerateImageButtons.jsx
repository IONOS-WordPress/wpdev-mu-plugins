import { BlockControls } from '@wordpress/block-editor';
import {
	Button,
	MenuItem,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { render } from '@shared/lib/dom';
import { magic } from '@draft/svg';

const supportedBlocks = [
	'core/image',
	'core/media-text',
	'core/gallery',
	'core/cover',
];

export const GenerateImageButtons = (CurrentComponents, props) => {
	const { openGeneralSidebar } = useDispatch(editPostStore);
	const { clientId: blockId, name: name } = props;

	useEffect(() => {
		if (!supportedBlocks.includes(name)) return;

		const frameSelector = 'iframe[name="editor-canvas"]';
		const frame = document.querySelector(frameSelector)?.contentDocument;

		const block = frame
			? frame.querySelector(`[data-block="${blockId}"]`)
			: document.querySelector(`[data-block="${blockId}"]`);
		if (!block) return;

		const parentSelector =
			'.block-editor-media-placeholder .components-form-file-upload';
		const placeHolder = Object.assign(document.createElement('div'), {
			className: 'components-form-file-upload',
		});
		block.querySelector(parentSelector)?.after(placeHolder);

		let root;
		const component = (
			<>
				<Button
					variant="primary"
					__next40pxDefaultSize
					onClick={async () => {
						openGeneralSidebar('extendify-draft/draft');
						await new Promise((r) => requestAnimationFrame(r));
						const btn = document.getElementById(
							'extendify-draft-image-gen-button',
						);
						btn?.focus();
						btn?.classList.add('animate-pulse-flash');
					}}>
					{__('Get Personalized Image', 'extendify-local')}
				</Button>
				{/* layout placeholder */}
				<span aria-hidden="true" />
			</>
		);
		const id = requestAnimationFrame(() => {
			root = render(component, placeHolder);
		});
		return () => {
			cancelAnimationFrame(id);
			root?.unmount();
			placeHolder?.remove();
		};
	}, [blockId, openGeneralSidebar, name]);

	return (
		<>
			<CurrentComponents {...props} />
			<BlockControls>
				<ToolbarButtons {...props} />
			</BlockControls>
		</>
	);
};

const GetPersonalizedImage = () => {
	const { openGeneralSidebar } = useDispatch(editPostStore);
	return (
		<MenuItem
			icon={magic}
			onClick={async () => {
				openGeneralSidebar('extendify-draft/draft');
				await new Promise((r) => requestAnimationFrame(r));
				const btn = document.getElementById('extendify-draft-image-gen-button');
				btn?.focus();
				btn?.classList.add('animate-pulse-flash');
			}}>
			{__('Get Personalized Image', 'extendify-local')}
		</MenuItem>
	);
};
const GetPersonalizedImageToolbar = () => {
	const { openGeneralSidebar } = useDispatch(editPostStore);
	return (
		<ToolbarGroup className="extendify-draft">
			<ToolbarButton
				className="py-1.5 pl-2 pr-3 text-white before:bg-editor-main before:content-[''] hover:before:bg-editor-main-darker"
				icon={magic}
				onClick={async () => {
					openGeneralSidebar('extendify-draft/draft');
					await new Promise((r) => requestAnimationFrame(r));
					const btn = document.getElementById(
						'extendify-draft-image-gen-button',
					);
					btn?.focus();
					btn?.classList.add('animate-pulse-flash');
				}}>
				{__('Ask AI', 'extendify-local')}
			</ToolbarButton>
		</ToolbarGroup>
	);
};

const ToolbarButtons = ({ name, attributes }) => {
	useEffect(() => {
		if (!supportedBlocks.includes(name)) return;

		let placeholder, root, rafInsert, rafOuter, observer;
		// use async iife to allow frame delays
		(async () => {
			await new Promise((r) => (rafOuter = requestAnimationFrame(r)));
			// Find a button on the toolbar that says replace or add
			const replaceBtn = Array.from(
				document.querySelectorAll('[data-toolbar-item="true"]'),
			)?.find(
				(btn) =>
					btn.textContent === __('Replace') || btn.textContent === __('Add'),
			);
			if (!replaceBtn) return;

			observer = new MutationObserver((mutations) => {
				// Button is open
				if (mutations[0].target.getAttribute('aria-expanded') === 'true') {
					// Find the popover section we want to attach to
					const pClass = '.block-editor-media-replace-flow__media-upload-menu';
					const popover = document.querySelector(pClass);
					if (!popover) return;

					// Attach the placeholder to the popover then render
					placeholder = document.createElement('div');
					popover.prepend(placeholder);
					rafInsert = requestAnimationFrame(() => {
						root = render(<GetPersonalizedImage />, placeholder);
					});
					return;
				}
				// Replace button is closed
				cancelAnimationFrame(rafInsert);
				root?.unmount();
				placeholder?.remove();
			});

			// Watch for aria-expanded attribute only
			observer.observe(replaceBtn, {
				attributes: true,
				childList: false,
				subtree: false,
			});
		})();

		return () => {
			[rafInsert, rafOuter].forEach(cancelAnimationFrame);
			root?.unmount();
			placeholder?.remove();
			observer?.disconnect();
		};
	}, [name, attributes]);

	if (!supportedBlocks.includes(name)) return null;

	return <GetPersonalizedImageToolbar />;
};
