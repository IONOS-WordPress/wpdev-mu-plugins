import apiFetch from '@wordpress/api-fetch';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Implementation of a custom storage engine for Zustand's persist middleware.
 * It replicates the Storage interface defined in https://developer.mozilla.org/en-US/docs/Web/API/Storage
 *
 * This storage uses a WordPress custom endpoint to persist the consent in `wp_usermeta`.
 */
const storage = {
	setItem: (_name, store) =>
		apiFetch({
			path: '/extendify/v1/shared/update-user-meta',
			method: 'POST',
			data: { option: 'ai_consent', value: store.state.userGaveConsent },
		}),
};

const state = (set, get) => ({
	showAIConsent: window.extSharedData?.showAIConsent ?? false,
	consentTermsCustom: window.extSharedData?.consentTermsCustom ?? '',
	userGaveConsent: window.extSharedData?.userGaveConsent ?? false,
	setUserGaveConsent: (userGaveConsent) => set({ userGaveConsent }),
	// Context refers to the feature where the function is being used.
	shouldShowAIConsent: (context) => {
		const { showAIConsent, consentTermsCustom, userGaveConsent } = get();
		const enabled = showAIConsent && consentTermsCustom;
		const display = {
			launch: enabled,
			draft: enabled && !userGaveConsent,
			'help-center': enabled && !userGaveConsent,
		};
		return display?.[context] ?? false;
	},
});

export const useAIConsentStore = create(
	persist(devtools(state, { name: 'Extendify AI Consent' }), {
		name: 'extendify-ai-consent',
		storage,
		skipHydration: true,
	}),
);
