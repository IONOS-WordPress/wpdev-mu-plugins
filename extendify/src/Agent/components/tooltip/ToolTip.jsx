import { Icon } from '@wordpress/components';
import { useEffect, useLayoutEffect, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Dialog, DialogTitle } from '@headlessui/react';
import { useGlobalStore } from '@agent/state/global';

export const ToolTip = ({ children, title, name, onClose, anchors = [] }) => {
	const { seenToolTips, setSeenToolTip, isMobile } = useGlobalStore();
	const [open, setOpen] = useState(false);
	const [left, setLeft] = useState(0);
	const [top, setTop] = useState(0);
	const [anchorWidth, setAnchorWidth] = useState(0);

	const onCloseModal = () => {
		setOpen(false);
		setSeenToolTip(name);
		onClose?.();
	};

	useLayoutEffect(() => {
		const anchorEl = anchors
			.map((s) => document.querySelector(s))
			.find(Boolean);
		if (!anchorEl || !open || isMobile) return;
		// In case the editor sidebar is open
		const sideBar = document.querySelector(
			'.interface-interface-skeleton__secondary-sidebar, .interface-interface-skeleton__sidebar',
		);
		const prevZ = sideBar?.style.zIndex;
		// Lower so it doesn't cover up the outline
		if (sideBar) sideBar.style.zIndex = 20;
		const prevOutline = anchorEl.style.outline;
		anchorEl.style.outline = '99999px solid rgba(0, 0, 0, 0.4)';
		// find the anchor's center (now only support bottom center)
		const rect = anchorEl.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height;
		setAnchorWidth(rect.width);
		setLeft(x);
		setTop(y);
		return () => {
			anchorEl.style.outline = prevOutline;
			if (sideBar) sideBar.style.zIndex = prevZ;
		};
	}, [anchors, open, isMobile]);

	useEffect(() => {
		if (seenToolTips.includes(name) || isMobile) return;
		const handleOpen = () => {
			const anchorEl = anchors
				.map((s) => document.querySelector(s))
				.find(Boolean);
			if (!anchorEl) return;
			const visible = anchorEl
				? !!(
						anchorEl.offsetWidth ||
						anchorEl.offsetHeight ||
						anchorEl.getClientRects().length
					)
				: false;
			if (!visible) return;
			setOpen(true);
		};
		window.addEventListener('extendify-agent:closed-button', handleOpen);
		return () => {
			window.removeEventListener('extendify-agent:closed-button', handleOpen);
		};
	}, [setOpen, seenToolTips, name, anchors, isMobile]);

	if (!open || isMobile) return;
	return (
		<Dialog
			static
			className="extendify-agent"
			open={open}
			onClose={onCloseModal}>
			<div className="relative z-max">
				<div
					onClick={onCloseModal}
					aria-hidden={true}
					role="presentation"
					className="fixed inset-0 z-10 h-screen w-screen bg-transparent"
				/>
				<div
					className="fixed z-20 flex min-w-80 max-w-xs flex-col rounded-lg bg-transparent shadow-2xl"
					style={{
						top: `${top + 20}px`,
						left: isRTL() ? `${left + 100}px` : `${left - 100}px`,
						transform: 'translate(-50%, 0)',
					}}>
					<div
						style={{ insetInlineEnd: `${anchorWidth / 2 - 5}px` }}
						className="absolute top-[-12px] h-0 w-0 transform border-b-[12px] border-l-[10px] border-r-[10px] border-transparent border-b-wp-theme-main"
					/>
					<button
						type="button"
						data-test="close-tooltip"
						className="ring-none focus:ring-none absolute right-0 top-0 z-20 m-2 flex h-6 w-6 items-center justify-center border-0 bg-wp-theme-main p-0 leading-none text-design-text outline-none focus:shadow-none rtl:left-0 rtl:right-auto"
						onClick={onCloseModal}
						aria-label={__('Close ToolTip', 'extendify-local')}>
						<Icon icon={close} className="h-4 w-4 fill-current" />
					</button>
					<DialogTitle className="sr-only">{title}</DialogTitle>
					<div className="text-md relative m-0 rounded-lg bg-wp-theme-main p-6 pt-8 text-left font-sans leading-7 text-design-text rtl:text-right">
						{children}
					</div>
				</div>
			</div>
		</Dialog>
	);
};
