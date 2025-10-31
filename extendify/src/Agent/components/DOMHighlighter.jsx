import { Tooltip } from '@wordpress/components';
import {
	createPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
import { motion } from 'framer-motion';
import { usePortal } from '@agent/hooks/usePortal';
import { useWorkflowStore } from '@agent/state/workflows';

const selector = [
	'[data-extendify-agent-block-id]',
	'[data-extendify-part-block-id]',
	'.wp-block-navigation',
].join(', ');
const ignored = ['wp-block-video', 'wp-block-spacer', 'wp-block-post-*'];
const SELECTED_ATTR = 'data-extendify-agent-block-selected';
const HIGHLIGHTER_CLS = 'extendify-agent-highlighter-mode';

export const DOMHighlighter = ({ busy = false }) => {
	const [rect, setRect] = useState(null);
	const mountNode = usePortal('extendify-agent-dom-mount');
	const raf = useRef(null);
	const el = useRef(null);
	const { getWorkflowsByFeature, block, setBlock } = useWorkflowStore();
	const enabled = getWorkflowsByFeature({ requires: ['block'] })?.length > 0;

	const clearBlock = useCallback(() => {
		setBlock(null);
		setRect(null);
		el.current = null;
		document.querySelector(HIGHLIGHTER_CLS)?.classList.remove(HIGHLIGHTER_CLS);
		document
			.querySelector(`[${SELECTED_ATTR}]`)
			?.removeAttribute(SELECTED_ATTR);
	}, [setBlock, setRect]);

	useEffect(() => {
		const handle = () => {
			setRect(null);
			el.current = null;
		};
		window.addEventListener('extendify-agent:remove-block-highlight', handle);
		return () =>
			window.removeEventListener(
				'extendify-agent:remove-block-highlight',
				handle,
			);
	}, []);

	useEffect(() => {
		if (busy || block) return;
		if (!mountNode || !enabled) return setRect(null);

		const onMove = (e) => {
			if (raf.current) return;
			raf.current = requestAnimationFrame(() => {
				raf.current = null;
				const target = e.target;

				if (!target) return setRect(null);
				const match = target.closest(selector);
				if (!match) return setRect(null);

				// Ignore some blocks
				const pattern = ignored.map((c) => c.replace('*', '.*')).join('|');
				const regex = new RegExp(`^(${pattern})$`);
				if (Array.from(match.classList).some((cls) => regex.test(cls))) {
					return setRect(null);
				}

				const innerBlockCount = Array.from(
					match.querySelectorAll(selector),
				).filter((el) => !ignored.some((c) => el.classList.contains(c))).length;

				// Keep complexity low for now
				if (innerBlockCount > 20) return setRect(null);

				el.current = match;
				const r = match.getBoundingClientRect();
				if (r.width <= 0 || r.height <= 0) return setRect(null);

				const { top, left, width, height } = r;
				setRect({ top, left, width, height });
			});
		};

		window.addEventListener('mousemove', onMove, { passive: true });
		return () => {
			window.removeEventListener('mousemove', onMove);
			if (raf.current) cancelAnimationFrame(raf.current);
		};
	}, [busy, mountNode, enabled, block]);

	useEffect(() => {
		const onScrollOrResize = () => {
			if (!el.current) return;
			const { top, left, width, height } = el.current.getBoundingClientRect();
			setRect({ top, left, width, height });
		};
		window.addEventListener('scroll', onScrollOrResize, { passive: true });
		window.addEventListener('resize', onScrollOrResize);
		return () => {
			window.removeEventListener('scroll', onScrollOrResize);
			window.removeEventListener('resize', onScrollOrResize);
		};
	}, [el]);

	useEffect(() => {
		if (!enabled || busy) return;

		const onClickCapture = (e) => {
			if (!rect || busy) return;
			// If they click inside the chat window, ignore
			if (e.target.closest('#extendify-agent-chat')) return;
			// find the real element under cursor
			const stack = document.elementsFromPoint(e.clientX, e.clientY) || [];
			if (!stack[0]) return;
			e.preventDefault();
			e.stopPropagation();

			const match = stack[0].closest(selector);
			if (!match && !block) return;
			const sameBlock = match?.hasAttribute(SELECTED_ATTR);
			// If we already have a block, clicking outside removes it
			if (block && !sameBlock) return clearBlock();
			if (block && sameBlock) return; // no change

			match.setAttribute(SELECTED_ATTR, true);
			document.querySelector('#extendify-agent-chat-textarea')?.focus();

			// determine what's in the block.
			const templatePart = match.closest('[data-extendify-part]');
			const details = {
				id: match.getAttribute('data-extendify-agent-block-id'),
				target: 'data-extendify-agent-block-id',
				hasNav:
					Boolean(match.querySelector('.wp-block-navigation')) ||
					match.classList.contains('wp-block-navigation'),
				hasSiteTitle:
					match.classList.contains('wp-block-site-title') ||
					Boolean(match.querySelector('.wp-block-site-title')),
				hasSiteLogo:
					match.classList.contains('wp-block-site-logo') ||
					Boolean(match.querySelector('.wp-block-site-logo')),
				hasLinks: Boolean(match.querySelector('a')) || match.tagName === 'A',
				hasImages:
					Boolean(match.querySelector('.wp-block-image')) ||
					match.classList.contains('wp-block-image') ||
					Boolean(match.querySelector('img')),
				hasText: /\S/.test((match.textContent || '').replace(/\u200B/g, '')),
			};
			// Override how we identify if it's a template part
			if (templatePart) {
				details.id = templatePart.getAttribute('data-extendify-part-block-id');
				details.target = 'data-extendify-part-block-id';
				details.template = templatePart.getAttribute('data-extendify-part');
			}
			setBlock(details);
		};

		// capture=true so we stop clicks before app code or link navigation
		window.addEventListener('click', onClickCapture, { capture: true });
		return () =>
			window.removeEventListener('click', onClickCapture, { capture: true });
	}, [enabled, setBlock, rect, clearBlock, block, busy]);

	useEffect(() => {
		if (!enabled) return;
		const root = document.querySelector('.wp-site-blocks');
		if (!root) return;
		root.classList.add('extendify-agent-highlighter-mode');
		return () => root.classList.remove('extendify-agent-highlighter-mode');
	}, [enabled]);

	useEffect(() => {
		if (!busy) return;
		const root = document.querySelector('.wp-site-blocks');
		if (!root) return;
		root.classList.add('extendify-agent-busy');
		return () => root.classList.remove('extendify-agent-busy');
	}, [busy]);

	if (!enabled || !rect || !mountNode) return null;

	const { top, left, width, height } = rect;
	const animate = { x: left, y: top, width, height, opacity: 1 };
	const transition = {
		type: 'spring',
		stiffness: 700,
		damping: 40,
		mass: 0.25,
	};
	return createPortal(
		<>
			{block && !busy ? (
				<Tooltip text={__('Remove highlight', 'extendify-local')}>
					<div
						role="button"
						className={
							'fixed z-higher h-6 w-6 -translate-y-3.5 cursor-pointer select-none items-center justify-center rounded-full text-center font-bold ring-1 ring-black'
						}
						onClick={() => setBlock(null)}
						style={{
							top,
							left: width / 2 + left - 12,
							backgroundColor: 'var(--wp--preset--color--primary, red)',
							color: 'var(--wp--preset--color--background, white)',
						}}>
						<Icon
							className="pointer-events-none fill-current leading-none"
							icon={close}
							size={18}
						/>
						<span className="sr-only">
							{__('Remove highlight', 'extendify-local')}
						</span>
					</div>
				</Tooltip>
			) : null}
			<motion.div
				initial={false}
				aria-hidden
				animate={animate}
				transition={transition}
				className="pointer-events-none fixed z-high-1 mix-blend-hard-light outline-dashed outline-4"
				style={{
					top: 0,
					left: 0,
					willChange: 'transform,width,height,opacity',
					outlineColor: 'var(--wp--preset--color--primary, red)',
				}}
			/>
		</>,
		mountNode,
	);
};
