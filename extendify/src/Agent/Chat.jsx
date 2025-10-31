import { useEffect } from '@wordpress/element';
import { DOMHighlighter } from '@agent/components/DOMHighlighter';
import { DragResizeLayout } from '@agent/components/layouts/DragResizeLayout';
import { MobileLayout } from '@agent/components/layouts/MobileLayout';
import { useGlobalStore } from '@agent/state/global';
import { useWorkflowStore } from '@agent/state/workflows';

export const Chat = ({ busy, children }) => {
	const { setIsMobile, isMobile } = useGlobalStore();
	const { domToolEnabled, block, setBlock } = useWorkflowStore();

	useEffect(() => {
		if (!isMobile || !block) return;
		// Remove the block if we switch to mobile
		setBlock(null);
	}, [isMobile, setIsMobile, block, setBlock]);

	useEffect(() => {
		let timeout;
		const onResize = () => {
			clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				setIsMobile(window.innerWidth < 783);
			}, 10);
		};
		window.addEventListener('resize', onResize);
		return () => {
			clearTimeout(timeout);
			window.removeEventListener('resize', onResize);
		};
	}, [setIsMobile]);

	if (isMobile) {
		return (
			<MobileLayout>
				<div
					id="extendify-agent-chat"
					className="flex min-h-0 flex-1 flex-grow flex-col font-sans">
					{children}
				</div>
			</MobileLayout>
		);
	}
	return (
		<DragResizeLayout>
			<div
				id="extendify-agent-chat"
				className="flex min-h-0 flex-1 flex-grow flex-col font-sans">
				{children}
			</div>
			{domToolEnabled && <DOMHighlighter busy={busy} />}
		</DragResizeLayout>
	);
};
