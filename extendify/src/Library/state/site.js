import apiFetch from '@wordpress/api-fetch';
import { safeParseJson } from '@shared/lib/parsing';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const path = '/extendify/v1/library/settings';
const storage = {
	getItem: async () => await apiFetch({ path }),
	setItem: async (_name, state) =>
		await apiFetch({ path, method: 'POST', data: { state } }),
};

const startingState = {
	siteType: {
		slug: '0default',
		name: 'Default',
	},
	category: '',
	totalImports: 0,
};
const incomingState = safeParseJson(window.extLibraryData.siteInfo);

export const useSiteSettingsStore = create(
	persist(
		(set) => ({
			...startingState,
			...(incomingState?.state ?? {}),
			// Override siteType with the value from the server
			siteType: window.extSharedData?.siteType ?? incomingState.siteType ?? {},

			setCategory: (category) => set({ category }),
			incrementImports: () =>
				set((state) => ({ totalImports: Number(state.totalImports) + 1 })),
		}),
		{
			name: 'extendify_library_site_data',
			storage: createJSONStorage(() => storage),
			skipHydration: true,
		},
	),
);
