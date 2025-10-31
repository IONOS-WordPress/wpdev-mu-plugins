import { createElement, useEffect, useRef, useState } from '@wordpress/element';
import { ScrollDownButton } from '@agent/components/ScrollDownButton';
import { ScrollIntoViewOnce } from '@agent/components/ScrollIntoViewOnce';
import { AgentMessage } from '@agent/components/messages/AgentMessage';
import { StatusMessage } from '@agent/components/messages/StatusMessage';
import { UserMessage } from '@agent/components/messages/UserMessage';
import { WorkflowComponent } from '@agent/components/messages/WorkflowComponent';
import { WorkflowMessage } from '@agent/components/messages/WorkflowMessage';
import { useChatStore } from '@agent/state/chat';
import { useGlobalStore } from '@agent/state/global';
import { useWorkflowStore } from '@agent/state/workflows';

export const ChatMessages = () => {
	const { open } = useGlobalStore();
	const { messages } = useChatStore();
	const { getWhenFinishedToolProps, getWorkflow } = useWorkflowStore();
	const workflow = getWorkflow();
	const whenFinishedToolProps = getWhenFinishedToolProps();
	const whenFinishedComponent = workflow?.whenFinished?.component;
	const [canScrollDown, setCanScrollDown] = useState(false);
	const containerRef = useRef(null);
	const isFreshPageLoad = useRef(true);

	// If last message is a user message, move it to the top
	const isUserMessage =
		messages.filter(({ type }) => type !== 'status').at(-1)?.details?.role ===
		'user';

	useEffect(() => {
		if (!containerRef.current || !open) return;
		if (!isFreshPageLoad.current) return;
		isFreshPageLoad.current = false;
		// Scroll to the bottom of the chat container on load
		containerRef.current.scrollTo({ top: containerRef.current.scrollHeight });
		return () => {
			isFreshPageLoad.current = true;
		};
	}, [open]);

	// Handles scrolling to the top of the last user message
	// TODO: if the user sends in a long message, maybe we scroll to the bottom
	// of the message offset by 2-3 lines
	useEffect(() => {
		if (!containerRef.current) return;
		if (!isUserMessage) return;
		const c = containerRef.current;
		const messages = c.querySelectorAll('[data-agent-message-role="user"]');
		const last = messages[messages.length - 1];
		if (!last || messages.length < 2) return;
		const scrollArea = c.querySelector('#extendify-agent-chat-scroll-area');
		const lastRect = last.getBoundingClientRect();
		const innerHeight = Array.from(scrollArea.children).reduce(
			(sum, child) => sum + child.offsetHeight,
			0,
		);
		const minHeight = innerHeight + c.clientHeight - lastRect.height;
		scrollArea.style.minHeight = `${minHeight}px`;
		last.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, [isUserMessage, messages]);

	// Handles the scroll down button visibility
	useEffect(() => {
		if (!containerRef.current) return;
		const c = containerRef.current;
		const last = c.querySelector(
			'#extendify-agent-chat-scroll-area > :last-child',
		);
		if (!last) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				const containerRect = c.getBoundingClientRect();
				const lastRect = entry.boundingClientRect;
				const isBelowViewport = lastRect.bottom > containerRect.bottom;
				setCanScrollDown(!entry.isIntersecting && isBelowViewport);
			},
			{ root: c },
		);
		observer.observe(last);
		return () => observer.disconnect();
	}, [messages]);

	return (
		<div
			ref={containerRef}
			style={{ overscrollBehavior: 'contain' }}
			className="relative flex-grow overflow-y-auto overflow-x-hidden p-1 pb-0 text-sm text-gray-900 md:p-2">
			<div id="extendify-agent-chat-scroll-area">
				{messages.map((message) => {
					const isLastMessage = messages.at(-1)?.id === message.id;
					const freshLoad = isFreshPageLoad.current;
					if (message.details?.role === 'user') {
						return <UserMessage key={message.id} message={message} />;
					}
					if (message.details?.role === 'assistant') {
						return (
							<AgentMessage
								key={message.id}
								animate={!freshLoad}
								message={message}
							/>
						);
					}
					if (message.type === 'workflow') {
						return <WorkflowMessage key={message.id} message={message} />;
					}
					if (message.type === 'workflow-component') {
						return <WorkflowComponent key={message.id} message={message} />;
					}
					if (
						message.type === 'status' &&
						// Only show the status if it's last, or a workflow-tool-completed message
						(isLastMessage ||
							['workflow-tool-completed', 'workflow-tool-canceled'].includes(
								message.details?.type,
							))
					) {
						const isError = message.details?.type === 'error';
						return (
							<StatusMessage
								animate={!isError}
								key={message.id}
								status={message}
							/>
						);
					}
					return null;
				})}
				{!workflow?.needsRedirect?.() &&
				whenFinishedToolProps?.id &&
				whenFinishedComponent ? (
					<ScrollIntoViewOnce>
						{createElement(whenFinishedComponent, whenFinishedToolProps)}
					</ScrollIntoViewOnce>
				) : null}
				{workflow?.needsRedirect?.() ? <workflow.redirectComponent /> : null}
			</div>
			<ScrollDownButton
				canScrollDown={canScrollDown}
				onClick={() => {
					if (!containerRef.current) return;
					const c = containerRef.current;
					// Scroll the last message into view
					const last = c.querySelector(
						'#extendify-agent-chat-scroll-area > :last-child',
					);
					if (!last) return;
					last.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}}
			/>
		</div>
	);
};
