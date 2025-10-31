import apiFetch from '@wordpress/api-fetch';
import { safeParseJson } from '@shared/lib/parsing';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

const startingState = {
	siteType: {
		slug: '0default',
		name: 'Default',
	},
	siteInformation: {
		title: undefined,
	},
	variation: null,
	style: null,
	pages: [],
	sitePlugins: [],
	// initialize the state with default values
	...(safeParseJson(window.extSharedData.userData.userSelectionData)?.state ??
		{}),
};

const state = () => ({
	...startingState,
	// Add methods here
});

const path = '/extendify/v1/shared/user-selections-data';
const storage = {
	getItem: async () => await apiFetch({ path }),
	setItem: async (_name, state) =>
		await apiFetch({ path, method: 'POST', data: { state } }),
};

export const useUserSelectionStore = create(
	persist(devtools(state, { name: 'Extendify User Selections' }), {
		storage: createJSONStorage(() => storage),
		skipHydration: true,
	}),
	state,
);
