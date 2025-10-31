import {
	useMemo,
	useEffect,
	useState,
	useRef,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Chat } from '@agent/Chat';
import { pickWorkflow, handleWorkflow, callTool, digest } from '@agent/api';
import { ChatInput } from '@agent/components/ChatInput';
import { ChatMessages } from '@agent/components/ChatMessages';
import { ChatSuggestions } from '@agent/components/ChatSuggestions';
import { PageDocument } from '@agent/components/PageDocument';
import { WelcomeScreen } from '@agent/components/WelcomeScreen';
import { UsageMessage } from '@agent/components/messages/UsageMessage';
import { useChatStore } from '@agent/state/chat';
import { useGlobalStore } from '@agent/state/global';
import { useWorkflowStore } from '@agent/state/workflows';

const devmode = window.extSharedData.devbuild;
// Used to abort when wf canceled - reset in cleanup()
let controller = new AbortController();

export const Agent = () => {
	const { hasMessages, addMessage } = useChatStore();
	const {
		mergeWorkflowData,
		getWorkflow,
		workflowData,
		setWorkflow,
		addWorkflowResult,
		setWhenFinishedToolProps,
		whenFinishedToolProps,
		getAvailableWorkflows,
		block,
		setBlock,
	} = useWorkflowStore();
	const workflowIds = getAvailableWorkflows().map((w) => w.id);
	const {
		open,
		setOpen,
		showSuggestions,
		setShowSuggestions,
		updateRetryAfter,
		isChatAvailable,
	} = useGlobalStore();
	const [canType, setCanType] = useState(true);
	const agentWorking = useRef(false);
	const toolWorking = useRef(false);
	const [waitingOnToolOrUser, setWaitingOnToolOrUser] = useState(false);
	const [loop, setLoop] = useState(0);
	const workflow = getWorkflow();
	const chatAvailable = useMemo(() => isChatAvailable(), [isChatAvailable]);

	const cleanup = useCallback(() => {
		setCanType(true);
		agentWorking.current = false;
		setWaitingOnToolOrUser(false);
		controller = new AbortController();
		block && setBlock(null);
		window.dispatchEvent(new Event('extendify-agent:remove-block-highlight'));
		const c = Array.from(
			document.querySelectorAll(
				'#extendify-agent-chat-scroll-area div:last-child',
			),
		)?.at(-1);
		c?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		c?.scrollBy({ top: -5, behavior: 'smooth' });
	}, [setBlock, block]);

	const findAgent = useCallback(
		async (options = {}) => {
			addMessage('status', { type: 'calling-agent' });
			const response = await pickWorkflow({
				workflows: workflowIds,
				options: { signal: controller.signal, ...options },
			}).catch((error) => {
				devmode && console.error(error);
				if (error?.response?.status === 429) {
					updateRetryAfter(error?.response?.headers?.get('Retry-After'));
					setCanType(false);
					addMessage('status', { type: 'credits-exhausted' });
					return;
				}
				setCanType(true);
				if (error === 'Workflow aborted') {
					addMessage('status', { type: 'workflow-canceled' });
					return;
				}
				addMessage('status', { type: 'error' });
				return;
			});
			if (!response) return;

			const { workflow: wf, reply } = response;
			if (wf?.id) setWorkflow(wf);
			if (reply) {
				const data = { role: 'assistant', content: reply, agent: wf?.agent };
				addMessage('message', data);
			}
			if (!wf?.id) setCanType(true);
		},
		[addMessage, updateRetryAfter, setWorkflow, workflowIds],
	);

	const handleSubmit = useCallback(
		async (message) => {
			setShowSuggestions(false);
			setWaitingOnToolOrUser(false);
			agentWorking.current = false;
			addMessage('message', { role: 'user', content: message });
			setCanType(false);
			// If they typed while waiting on a redirect, reset the workflow
			if (workflow?.needsRedirect?.()) {
				setWorkflow(null);
			}
			if (workflow && !workflow?.needsRedirect?.()) {
				// reset the workflow to let the effect handle it
				const wfData = workflowData || {};
				setWorkflow({ ...workflow });
				mergeWorkflowData(wfData);
				return;
			}
			await findAgent().catch((e) => devmode && console.error(e));
		},
		[
			addMessage,
			findAgent,
			mergeWorkflowData,
			setWorkflow,
			workflow,
			workflowData,
			setShowSuggestions,
		],
	);

	useEffect(() => {
		// Allow external messages to trigger the agent
		const handleMessage = ({ detail }) => {
			if (!detail?.message) return;
			handleSubmit(detail.message);
		};
		// Allow external code to clear the block and workflow
		const handleCleanup = () => {
			controller.abort('Workflow aborted');
			setWorkflow(null);
			cleanup();
			addMessage('status', { type: 'workflow-canceled' });
			return;
		};
		window.addEventListener('extendify-agent:cancel-workflow', handleCleanup);
		window.addEventListener('extendify-agent:chat-submit', handleMessage);
		return () => {
			window.removeEventListener(
				'extendify-agent:cancel-workflow',
				handleCleanup,
			);
			window.removeEventListener('extendify-agent:chat-submit', handleMessage);
		};
	}, [handleSubmit, cleanup, setWorkflow, addMessage]);

	// Handle whenFinished component confirm/cancel
	useEffect(() => {
		const handleConfirm = async ({ detail }) => {
			if (toolWorking.current) return;
			toolWorking.current = true;
			const { data, whenFinishedToolProps, shouldRefreshPage } = detail ?? {};
			const { summary, status, whenFinishedTool, answerId } =
				whenFinishedToolProps.agentResponse;
			const { id, labels } = whenFinishedTool || {};
			// Not all workflows have a tool at the end (e.g. tours)
			const toolResponse = await callTool?.({ tool: id, inputs: data }).catch(
				(error) => {
					const { sessionId } = workflow || {};
					digest({ caller: `when-finished: ${id}`, sessionId, error });
					devmode && console.error(error);
					return { error: error.message };
				},
			);
			toolWorking.current = false;
			// Add the workflow result to the history
			addWorkflowResult({
				answerId,
				agentName: workflow?.agent?.name,
				summary,
				status,
				errorMsg: toolResponse?.error,
			});
			if (toolResponse?.error) {
				addMessage('status', { type: 'error' });
				setWorkflow(null);
				cleanup();
				return;
			}
			addMessage('status', {
				label: labels?.confirm,
				type: 'workflow-tool-completed',
			});
			addMessage('workflow', {
				status: 'completed',
				agent: workflow.agent,
				answerId,
			});
			setWorkflow(null);
			cleanup();

			if (shouldRefreshPage) window.location.reload();
		};
		const handleCancel = ({ detail }) => {
			if (toolWorking.current) return;
			const { summary, whenFinishedTool, answerId } =
				detail.whenFinishedToolProps.agentResponse;
			addMessage('workflow', {
				status: 'canceled',
				agent: workflow.agent,
				answerId,
			});
			addWorkflowResult({
				answerId,
				summary,
				status: 'canceled',
				agentName: workflow?.agent?.name,
			});
			setWorkflow(null);
			cleanup();
			addMessage('status', {
				label: whenFinishedTool?.labels?.cancel,
				type: 'workflow-tool-canceled',
			});
		};
		window.addEventListener('extendify-agent:workflow-confirm', handleConfirm);
		window.addEventListener('extendify-agent:workflow-cancel', handleCancel);
		return () => {
			window.removeEventListener(
				'extendify-agent:workflow-confirm',
				handleConfirm,
			);
			window.removeEventListener(
				'extendify-agent:workflow-cancel',
				handleCancel,
			);
		};
	}, [addMessage, cleanup, addWorkflowResult, setWorkflow, workflow]);

	useEffect(() => {
		const handleClose = () => setOpen(false);
		const handleOpen = () => setOpen(true);
		window.addEventListener('extendify-agent:close', handleClose);
		window.addEventListener('extendify-agent:open', handleOpen);
		return () => {
			window.removeEventListener('extendify-agent:close', handleClose);
			window.removeEventListener('extendify-agent:open', handleOpen);
		};
	}, [setOpen]);

	useEffect(() => {
		if (waitingOnToolOrUser || !open || !workflow?.id) return;
		// Some workflows require they dont change pages
		const theyMoved = workflow?.startingPage !== window.location.href;
		// Requires a block to be selected
		const blockMissing = !block && workflow?.requires?.includes('block');
		const cancelWorkflow =
			(workflow?.cancelOnPageChange && theyMoved) || blockMissing;
		if (cancelWorkflow) {
			addMessage('workflow', { status: 'canceled', agent: workflow.agent });
			setWorkflow(null);
			cleanup();
			return;
		}
		// A component is running
		if (whenFinishedToolProps?.id) return;
		// They must be on a page where they can do work
		if (workflow?.needsRedirect?.()) {
			cleanup();
			return;
		}
		(async () => {
			if (agentWorking.current) return; // Prevent multiple calls
			setCanType(false);
			setShowSuggestions(false);
			agentWorking.current = true;
			addMessage('status', { type: 'agent-working' });
			const agentResponse = await handleWorkflow({
				workflow,
				workflowData,
				options: { signal: controller.signal },
			}).catch((error) => {
				if (error === 'Workflow aborted') {
					addMessage('status', { type: 'workflow-canceled' });
					setWorkflow(null);
					cleanup();
					return;
				}
				const { sessionId } = workflow || {};
				digest({ caller: 'handle-workflow', sessionId, error });
				devmode && console.error(error);
				return { error: error.message };
			});
			if (!agentResponse) return;
			const { summary, status, answerId } = agentResponse;
			// Add the workflow result to the history
			addWorkflowResult({
				answerId,
				summary,
				status,
				errorMsg: agentResponse?.error,
				agentName: workflow?.agent?.name,
			});
			if (!open) return;
			if (agentResponse.error) {
				// mutate the window to add failed tools rather than keep state
				window.extAgentData.failedWorkflows =
					window.extAgentData.failedWorkflows || new Set();
				window.extAgentData.failedWorkflows.add(workflow.id);
				throw new Error(`Error handling workflow: ${agentResponse.error}`);
			}

			// The ai sent back some text to show to the user
			if (agentResponse.reply) {
				addMessage('message', {
					role: 'assistant',
					content: agentResponse.reply,
					followup: !!agentResponse.tool,
					pageSuggestion: agentResponse.pageSuggestion,
					agent: workflow.agent,
					sessionId: workflow?.sessionId,
				});
			}
			// This is at the end of the workflow
			// and we are about to execute the final tool
			if (agentResponse.whenFinishedTool?.id) {
				setWhenFinishedToolProps({
					...agentResponse.whenFinishedTool,
					agentResponse,
				});
				// If static, add it as a message
				const { id, inputs, static: staticC } = agentResponse.whenFinishedTool;
				if (staticC) {
					addMessage('workflow-component', { id, status: 'completed', inputs });
					setWorkflow(null);
					addMessage('workflow', {
						status: 'completed',
						agent: workflow.agent,
						answerId,
					});
					cleanup();
				}
				return;
			}
			// Agent thinks it needs to handoff to another agent
			if (agentResponse.status === 'handoff') {
				const currentWorkflowId = workflow.id;
				setWorkflow(null);
				cleanup();
				await findAgent({ handoff: currentWorkflowId });
				return;
			}
			// If we're done, it means the AI has the answer
			if (agentResponse.status === 'completed') {
				setWorkflow(null);
				cleanup();
				addMessage('workflow', {
					status: 'completed',
					agent: workflow.agent,
					answerId,
				});
				return;
			}
			if (agentResponse.status === 'canceled') {
				setWorkflow(null);
				cleanup();
				addMessage('workflow', {
					status: 'canceled',
					agent: workflow.agent,
					answerId,
				});
				return;
			}
			// These inputs are filled out by the AI
			mergeWorkflowData(agentResponse.inputs);
			// Agent needs more info from a
			if (agentResponse.tool) {
				const { id, inputs, labels } = agentResponse.tool;
				addMessage('status', { label: labels?.started, type: 'tool-started' });
				const toolData = await Promise.all([
					callTool({ tool: id, inputs }),
					new Promise((resolve) => setTimeout(resolve, 3000)),
				])
					.then(([data]) => data)
					.catch((error) => {
						const { sessionId } = workflow || {};
						digest({ caller: `in-progress: ${id}`, sessionId, error });
						devmode && console.error(error);
						throw error;
					});
				addMessage('status', {
					label: labels?.confirm,
					type: 'tool-completed',
				});
				await new Promise((resolve) => setTimeout(resolve, 1000));
				mergeWorkflowData(toolData);
				setWaitingOnToolOrUser(false);
				agentWorking.current = false;
				setLoop((prev) => prev + 1); // Trigger next loop
				return;
			}
			setCanType(true);
			setWaitingOnToolOrUser(true);
		})().catch((error) => {
			const { sessionId } = workflow || {};
			digest({ caller: 'main-loop', sessionId, error });
			devmode && console.error(error);
			setWorkflow(null);
			cleanup();
			addMessage('status', { type: 'error' });
		});
	}, [
		loop,
		cleanup,
		addWorkflowResult,
		open,
		workflow,
		workflowData,
		addMessage,
		setWorkflow,
		agentWorking,
		waitingOnToolOrUser,
		mergeWorkflowData,
		canType,
		findAgent,
		setShowSuggestions,
		whenFinishedToolProps,
		setWhenFinishedToolProps,
		block,
	]);

	useEffect(() => {
		if (!canType) return;
		document.querySelector('#extendify-agent-chat-textarea')?.focus();
	}, [canType]);

	const showWelcomeScreen = !hasMessages();
	const showPromptSuggestions =
		!workflow?.id &&
		!showWelcomeScreen &&
		chatAvailable &&
		showSuggestions &&
		!block;
	const busy = !canType || !chatAvailable || workflow?.id;

	return (
		<Chat busy={busy}>
			<div className="relative z-50 flex h-full flex-col justify-between overflow-auto border-t border-solid border-gray-300">
				{showWelcomeScreen ? (
					<div
						className="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden"
						style={{
							backgroundImage:
								'linear-gradient( to bottom, #f0f0f0 0%, #fff 60%,  #fff 100%)',
						}}>
						<div className="flex-grow" />
						<WelcomeScreen />
					</div>
				) : (
					<ChatMessages
						redirectComponent={
							workflow?.needsRedirect?.() ? workflow.redirectComponent : null
						}
					/>
				)}

				<div>
					<div className="relative flex flex-col px-4 pb-2 pt-2.5 shadow-lg-flipped">
						{showPromptSuggestions ? <ChatSuggestions /> : null}
						{block ? <PageDocument busy={busy} blockId={block.id} /> : null}
						<UsageMessage
							onReady={() => {
								cleanup();
								setShowSuggestions(true);
								addMessage('status', { type: 'credits-restored' });
							}}
						/>
					</div>
					<div className="p-4 pb-2 pt-0">
						<ChatInput
							disabled={!canType || !chatAvailable}
							handleSubmit={handleSubmit}
						/>
					</div>
					<div className="text-pretty px-4 pb-2 text-center text-xss leading-none text-gray-600">
						{__(
							'AI Agent can make mistakes. Check changes before saving.',
							'extendify-local',
						)}
					</div>
				</div>
			</div>
		</Chat>
	);
};
