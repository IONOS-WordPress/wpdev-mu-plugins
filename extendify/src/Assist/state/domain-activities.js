import apiFetch from '@wordpress/api-fetch';
import { safeParseJson } from '@shared/lib/parsing';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
	activities: [],
	...(safeParseJson(
		window.extAssistData.userData.domainsRecommendationsActivities,
	)?.state ?? {}),
};

const state = (set, get) => ({
	...initialState,
	setDomainActivity: ({ domain, position, type = 'primary' }) => {
		const activities = get().activities;
		set({
			activities: [
				...activities,
				{
					domain,
					position,
					type,
					action: 'clicked',
					date: new Date().toISOString(),
				},
			],
		});
	},
});

const path = '/extendify/v1/assists/domains-recommendations-activities';
const storage = {
	getItem: async () => await apiFetch({ path }),
	setItem: async (_name, state) =>
		await apiFetch({ path, method: 'POST', data: { state } }),
};

export const useDomainActivities = create(
	persist(
		devtools(state, { name: 'Extendify Domains Recommendations insights' }),
		{
			storage: createJSONStorage(() => storage),
			skipHydration: true,
		},
	),
	state,
);
