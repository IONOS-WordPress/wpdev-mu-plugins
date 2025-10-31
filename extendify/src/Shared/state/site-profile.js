import apiFetch from '@wordpress/api-fetch';
import { safeParseJson } from '@shared/lib/parsing';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

const generalSiteProfile =
	safeParseJson(window.extSharedData.userData.userSelectionData)?.state
		?.siteProfile || {};

const initialState = {
	siteProfile: {
		aiDescription:
			window.extSharedData?.siteProfile?.aiDescription ||
			generalSiteProfile?.aiDescription,
		aiSiteType: generalSiteProfile?.aiSiteType,
		aiSiteCategory: generalSiteProfile?.aiSiteCategory,
		aiKeywords: generalSiteProfile?.aiKeywords,
	},
};

const state = (set) => ({
	...initialState,
	setSiteProfile(data) {
		const siteProfile = Object.assign(
			{
				aiSiteType: initialState?.siteProfile?.aiSiteType,
				aiSiteCategory: initialState?.siteProfile?.aiSiteCategory,
				aiDescription: initialState?.siteProfile?.aiDescription,
				aiKeywords: initialState?.siteProfile?.aiKeywords,
			},
			data || {},
		);

		set({ siteProfile });
	},
	resetState() {
		set(initialState);
	},
});

const path = '/extendify/v1/shared/site-profile';
const storage = {
	getItem: async () => await apiFetch({ path }),
	setItem: async (_name, state) => {
		await apiFetch({
			path,
			method: 'POST',
			data: { value: safeParseJson(state)?.state?.siteProfile || {} },
		});
	},
};

export const useSiteProfileStore = create(
	persist(devtools(state, { name: 'Extendify Site Profile' }), {
		storage: createJSONStorage(() => storage),
		skipHydration: false,
	}),
	state,
);
