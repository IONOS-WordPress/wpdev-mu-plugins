import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

const state = (set, get) => ({
	progress: [],
	updateSiteAssistTourStatus(taskId) {
		set({ progress: [taskId] });
	},
	finishedTour(tourId) {
		return get().progress.find((tour) => tour === tourId);
	},
});

export const useSiteAssistTourStorage = create(
	persist(devtools(state, { name: 'Extendify Site Assist Tour' }), {
		name: `extendify-site-assist-tour-${window.extSharedData.siteId}`,
		storage: createJSONStorage(() => localStorage),
	}),
	state,
);
