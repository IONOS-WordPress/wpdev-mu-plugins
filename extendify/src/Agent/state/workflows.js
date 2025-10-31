import apiFetch from '@wordpress/api-fetch';
import { deepMerge } from '@shared/lib/utils';
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { workflows } from '@agent/workflows/workflows';

const state = (set, get) => ({
	workflow: null,
	block: null, // data-extendify-agent-block-id + details about the block
	setBlock: (block) => set({ block }),
	domToolEnabled: false,
	setDomToolEnabled: (enabled) => {
		if (get().block) return; // can't disable if a block is set
		set({ domToolEnabled: enabled });
	},
	getWorkflow: () => {
		const curr = get().workflow;
		// Workflows may define a "parent" workflow via templateId
		const currId = curr?.templateId || curr?.id;
		const wf = workflows.find(({ id }) => id === currId);
		if (!wf?.id) return curr || null;
		return { ...deepMerge(curr, wf || {}), id: curr?.id };
	},
	// Gets the workflows available to the user
	// TODO: maybe we need to have a way to include a
	// workflow regardless of the block being active?
	getAvailableWorkflows: () => {
		let wfs = workflows.filter(({ available }) => available());
		// If a block is set, only include those with 'block'
		const blockWorkflows = wfs.filter(({ requires }) =>
			requires?.includes('block'),
		);
		if (get().block) return blockWorkflows;
		// otherwise remove all of the above
		return wfs.filter(({ id }) => !blockWorkflows.some((w) => w.id === id));
	},
	getWorkflowsByFeature: ({ requires } = {}) => {
		if (!requires) return workflows.filter(({ available }) => available());
		// e.g. requires: ['block']
		return workflows.filter(
			({ available, requires: workflowRequires }) =>
				available() &&
				(!requires || workflowRequires?.some((s) => requires.includes(s))),
		);
	},
	workflowData: null,
	// This is the history of the results
	// { answerId: '', summary: '', canceled: false,  reason: '', error: false, completed: false, whenFinishedTool: null }[]
	workflowHistory: window.extAgentData?.workflowHistory || [],
	// Data for the tool component that shows up at the end of a workflow
	whenFinishedToolProps: null,
	getWhenFinishedToolProps: () => {
		const { whenFinishedToolProps } = get();
		if (!whenFinishedToolProps) return null;
		return {
			...whenFinishedToolProps,
			onConfirm: (props = {}) => {
				window.dispatchEvent(
					new CustomEvent('extendify-agent:workflow-confirm', {
						detail: { ...props, whenFinishedToolProps },
					}),
				);
			},
			onCancel: () => {
				window.dispatchEvent(
					new CustomEvent('extendify-agent:workflow-cancel', {
						detail: { whenFinishedToolProps },
					}),
				);
			},
		};
	},
	addWorkflowResult: (data) => {
		if (data.status === 'completed') {
			set((state) => {
				const max = Math.max(0, state.workflowHistory.length - 10);
				return {
					workflowHistory: [data, ...state.workflowHistory.toSpliced(0, max)],
				};
			});
		}
		const workflowId = get().workflow?.id;
		if (!workflowId) return;
		// Persist it to the server
		const path = '/extendify/v1/agent/workflows';
		apiFetch({
			method: 'POST',
			keepalive: true,
			path,
			data: { workflowId, ...data },
		});
	},
	mergeWorkflowData: (data) => {
		set((state) => {
			if (!state.workflowData) return { workflowData: data };
			return {
				workflowData: { ...state.workflowData, ...data },
			};
		});
	},
	setWorkflow: (workflow) =>
		set({
			workflow: workflow
				? { ...workflow, startingPage: window.location.href }
				: null,
			workflowData: null,
			whenFinishedToolProps: null,
		}),
	setWhenFinishedToolProps: (whenFinishedToolProps) =>
		set({ whenFinishedToolProps }),
});

export const useWorkflowStore = create()(
	persist(devtools(state, { name: 'Extendify Agent Workflows' }), {
		name: `extendify-agent-workflows-${window.extSharedData.siteId}`,
		partialize: (state) => {
			// eslint-disable-next-line
			const { block, workflowHistory, ...rest } = state;
			return { ...rest };
		},
	}),
);
