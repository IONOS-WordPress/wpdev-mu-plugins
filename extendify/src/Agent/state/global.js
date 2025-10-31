import { isInTheFuture } from '@wordpress/date';
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

const DEFAULT_HEIGHT = 600;

const startingPosition = {
	x: window.innerWidth - 410 - 20,
	y: window.innerHeight - DEFAULT_HEIGHT,
	width: 410,
	height: DEFAULT_HEIGHT,
};

export const useGlobalStore = create()(
	persist(
		devtools(
			(set, get) => ({
				retryAfter: undefined,
				open: true,
				minimized: false,
				seenToolTips: [],
				showSuggestions: true,
				// e.g. floating, docked-left, docked-right ?
				mode: 'floating',
				...startingPosition,
				queuedTour: null,
				scratch: {},
				isMobile: window.innerWidth < 768,
				setIsMobile: (isMobile) => set({ isMobile }),
				queueTourForRedirect: (tour) => set({ queuedTour: tour }),
				clearQueuedTour: () => set({ queuedTour: null }),
				setOpen: (open) => {
					if (!open) {
						get().resetPosition();
						window.dispatchEvent(
							new CustomEvent('extendify-agent:cancel-workflow'),
						);
					}
					set({ open });
				},
				setMinimized: (minimized) => {
					if (get().minimized === minimized) return;
					set({ minimized });
				},
				setShowSuggestions: (show) => set({ showSuggestions: show }),
				toggleOpen: () =>
					set((state) => {
						if (!state.open) {
							get().resetPosition();
						}
						return { open: !state.open };
					}),
				setSize: (width, height) => set({ width, height }),
				setPosition: (x, y) => set({ x, y }),
				resetPosition: () =>
					set({
						...startingPosition,
						y: window.innerHeight - DEFAULT_HEIGHT,
					}),
				setSeenToolTip: (name) =>
					set((state) => {
						if (state.seenToolTips.includes(name)) return state;
						return { seenToolTips: [...state.seenToolTips, name] };
					}),
				updateRetryAfter: (retryAfter) => set({ retryAfter }),
				isChatAvailable: () => {
					const { retryAfter } = get();
					if (!retryAfter) return true;
					const stillWaiting = isInTheFuture(new Date(Number(retryAfter)));
					if (!stillWaiting) set({ retryAfter: undefined });
					return !stillWaiting;
				},
				setScratch: (key, value) =>
					set((state) => ({ scratch: { ...state.scratch, [key]: value } })),
				getScratch: (key) => get().scratch[key] || null,
				deleteScratch: (key) =>
					set((state) => {
						// eslint-disable-next-line
						const { [key]: _, ...rest } = state.scratch;
						return { scratch: rest };
					}),
			}),
			{ name: 'Extendify Agent Global' },
		),
		{
			name: `extendify-agent-global-${window.extSharedData.siteId}`,
			partialize: (state) => {
				// eslint-disable-next-line
				const { showSuggestions, isMobile, ...rest } = state;
				return { ...rest };
			},
		},
	),
);
