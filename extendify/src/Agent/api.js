import { AI_HOST } from '@constants';
import { useChatStore } from '@agent/state/chat';
import { useGlobalStore } from '@agent/state/global';
import { useWorkflowStore } from '@agent/state/workflows';
import { tools } from '@agent/workflows/workflows';

const extraBody = {
	...Object.fromEntries(
		Object.entries(window.extSharedData).filter(([key]) =>
			// Optionally add items to request body
			[
				'partnerId',
				'devbuild',
				'version',
				'siteId',
				'wpLanguage',
				'wpVersion',
				'siteProfile',
			].includes(key),
		),
	),
};

const extra = () => {
	const { x, y, width, height } = useGlobalStore.getState();
	return {
		userAgent: window?.navigator?.userAgent,
		vendor: window?.navigator?.vendor || 'unknown',
		platform:
			window?.navigator?.userAgentData?.platform ||
			window?.navigator?.platform ||
			'unknown',
		mobile: window?.navigator?.userAgentData?.mobile,
		width: window.innerWidth,
		height: window.innerHeight,
		screenHeight: window.screen.height,
		screenWidth: window.screen.width,
		orientation: window.screen.orientation?.type,
		touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
		agentUI: { x, y, width, height },
	};
};

export const pickWorkflow = async ({ workflows, options }) => {
	const { failedWorkflows, context } = window.extAgentData;
	const failed = failedWorkflows ?? new Set();
	const filteredWorkflows = workflows.filter((wf) => !failed.has(wf.id));

	const { workflowHistory: pastWorkflows, block } = useWorkflowStore.getState();
	const messages = useChatStore.getState().getMessagesForAI();
	const response = await fetch(`${AI_HOST}/api/agent/find-agent`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal: options?.signal,
		body: JSON.stringify({
			...extraBody,
			workflows: filteredWorkflows,
			workflowHistory: pastWorkflows
				.filter(Boolean)
				.slice(0, 5)
				.filter((h) => h.summary)
				.map((h) => h.summary),
			previousAgentName: pastWorkflows.at(0)?.agentName,
			context,
			agentContext: window.extAgentData.agentContext,
			messages: messages.slice(-5),
			hasBlock: Boolean(block), // todo: remove this
			blockDetails: block,
			...options,
			extra: extra(),
		}),
	});

	if (!response.ok) {
		digest({
			caller: 'pick-workflow',
			error: {
				name: response.statusText,
				messages: response.statusMessage,
			},
		});
		const error = new Error('Bad response from server');
		error.response = response;
		throw error;
	}
	return await response.json();
};

export const handleWorkflow = async ({ workflow, workflowData, options }) => {
	const messages = useChatStore.getState().getMessagesForAI();
	const response = await fetch(`${AI_HOST}/api/agent/handle-workflow`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal: options?.signal,
		body: JSON.stringify({
			...extraBody,
			workflow,
			workflowData,
			messages: messages,
			context: window.extAgentData.context,
			agentContext: window.extAgentData.agentContext,
			extra: extra(),
		}),
	}).catch((error) => {
		throw error;
	});

	if (!response.ok) throw new Error('Bad response from server');
	return await response.json();
};

export const rateAnswer = ({ answerId, rating }) =>
	fetch(`${AI_HOST}/api/agent/rate-workflow`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ answerId, rating }),
	}).catch((error) =>
		digest({
			caller: 'rateAnswer',
			error,
			extra: { answerId, rating },
		}),
	);

export const callTool = async ({ tool, inputs }) => {
	if (!tools[tool]) throw new Error(`Tool ${tool} not found`);
	return await tools[tool](inputs);
};

export const digest = ({ error, sessionId, caller, additional = {} }) => {
	if (Boolean(extraBody?.devbuild) === true) return;

	const errorMessage = () => {
		if (error.response && error.response.statusText) {
			return (
				error.response?.statusText || error.response.message || 'Unknown error'
			);
		}
		return typeof error === 'string'
			? error
			: error?.message || 'Unknown error';
	};

	const errorData = {
		message: errorMessage(),
		name: error?.name,
	};

	return fetch(`${AI_HOST}/api/agent/digest`, {
		method: 'POST',
		keepalive: true,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			...extraBody,
			phpVersion: window.extSharedData?.phpVersion,
			sessionId,
			error: errorData,
			browser: {
				userAgent: window.navigator?.userAgent,
				vendor: window.navigator?.vendor,
				platform: window.navigator?.platform,
				width: window.innerWidth,
				height: window.innerHeight,
				touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
			},
			caller,
			...additional,
			extra: extra(),
		}),
	}).catch(() => {});
};

export const recordAgentActivity = ({ action, sessionId, value = {} }) => {
	if (!sessionId) {
		return Promise.resolve(null);
	}

	return fetch(`${AI_HOST}/api/agent/activities`, {
		keepalive: true,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			...extraBody,
			action,
			sessionId,
			value,
		}),
	});
};
