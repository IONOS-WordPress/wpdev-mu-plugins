import { Tooltip } from '@wordpress/components';
import {
	createPortal,
	useState,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useDraggable } from '@agent/hooks/useDraggable';
import { usePortal } from '@agent/hooks/usePortal';
import { useResizable } from '@agent/hooks/useResizable';
import { useGlobalStore } from '@agent/state/global';

// TODO: some of the bound checking isn't working that well.
// For example, the user shrinks the height of the browser.
// On reload this should at least put the window in bounds.
// Maybe a resize observer would be useful.

export const DragResizeLayout = ({ children }) => {
	const [el, setEl] = useState(null);
	const mountNode = usePortal('extendify-agent-mount');
	const {
		open,
		x: top,
		y: left,
		width,
		height,
		setOpen,
		setSize,
		setPosition,
	} = useGlobalStore();
	// So it will re-render the hooks when mounted
	const ref = useCallback(
		(node) => requestAnimationFrame(() => setEl(node)),
		[],
	);
	useDraggable({
		el,
		open,
		initialPosition: { x: top, y: left },
		onDragEnd: (x, y) => {
			setPosition(x, y);
			window.dispatchEvent(
				new CustomEvent('extendify-agent:drag-end', {
					detail: { x, y },
				}),
			);
		},
	});
	useResizable({
		el,
		open,
		initialSize: { width, height },
		onResizeEnd: (width, height) => {
			setSize(width, height);
			window.dispatchEvent(
				new CustomEvent('extendify-agent:resize-end', {
					detail: { width, height },
				}),
			);
		},
	});

	useEffect(() => {
		if (!el || !open) return;
		// If it's not intersecting, close it
		const observer = new IntersectionObserver((entries) => {
			if (!entries[0].isIntersecting) setOpen(false);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [el, open, setOpen]);

	const closeAgent = () => {
		setOpen(false);
		window.dispatchEvent(new CustomEvent('extendify-agent:closed-button'));
	};

	if (!mountNode || !open) return null;

	return createPortal(
		<AnimatePresence>
			<motion.div
				key="agent-popout-modal"
				id="extendify-agent-popout-modal"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ y: 0, opacity: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
				className="fixed bottom-0 right-0 z-higher flex max-h-full max-w-full flex-col rounded-lg border border-solid border-gray-300 bg-white shadow-2xl-flipped rtl:left-0 rtl:right-auto"
				style={{ top, left, width, height }}
				ref={ref}>
				<>
					<div className="group flex shrink-0 items-center justify-between overflow-hidden rounded-t-[calc(0.5rem-1px)] bg-banner-main text-banner-text">
						<div
							data-extendify-agent-handle
							draggable
							className="flex h-full flex-grow cursor-grab select-none items-center justify-between gap-1 p-0 py-3">
							<div className="flex h-5 justify-center gap-2 px-4 rtl:after:-right-0">
								<div className="flex h-5 max-w-[9rem] overflow-hidden">
									<img
										className="max-h-full max-w-full object-contain"
										src={window.extSharedData.partnerLogo}
										alt={window.extSharedData.partnerName}
									/>
								</div>
								<div className="flex items-center rounded-lg bg-banner-text px-2 font-sans text-xs leading-none text-banner-main">
									{_x('beta', 'Feature in beta status', 'extendify-local')}
								</div>
							</div>
							<div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
								<DragButton />
							</div>
						</div>
						<Tooltip text={__('Close window', 'extendify-local')}>
							<button
								type="button"
								className="relative z-10 flex h-full items-center rounded-none border-0 bg-banner-main py-3 pe-4 ps-2 text-banner-text outline-none ring-design-main focus:shadow-none focus:outline-none focus-visible:outline-design-main"
								onClick={closeAgent}>
								<Icon
									className="pointer-events-none fill-current leading-none"
									icon={close}
									size={18}
								/>
								<span className="sr-only">
									{__('Close window', 'extendify-local')}
								</span>
							</button>
						</Tooltip>
					</div>
					{children}
					<div
						data-extendify-agent-resize
						className="absolute -bottom-2 -right-2 z-high h-6 w-6">
						<div className="h-6 w-6 cursor-se-resize" />
					</div>
				</>
			</motion.div>
		</AnimatePresence>,
		mountNode,
	);
};

const DragButton = (props) => {
	return (
		<div style={{ userSelect: 'none' }} className="relative flex" {...props}>
			<Icon
				className="pointer-events-none text-banner-text"
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="24"
						height="24"
						className="pointer-events-none"
						aria-hidden="true"
						focusable="false">
						{/* hardcoded to use currentColor */}
						<path
							fill="currentColor"
							d="M8 7h2V5H8v2zm0 6h2v-2H8v2zm0 6h2v-2H8v2zm6-14v2h2V5h-2zm0 8h2v-2h-2v2zm0 6h2v-2h-2v2z"></path>
					</svg>
				}
				size={24}
			/>
			<span className="sr-only">{__('Drag to move', 'extendify-local')}</span>
		</div>
	);
};
