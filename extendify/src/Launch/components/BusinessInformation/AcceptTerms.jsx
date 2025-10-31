import { __, sprintf } from '@wordpress/i18n';
import { useAIConsentStore } from '@shared/state/ai-consent';

export const AcceptTerms = () => {
	const { consentTermsCustom } = useAIConsentStore();

	const links = {
		terms: {
			url: 'https://openai.com/policies/terms-of-use/',
			text: __('Terms of Use', 'extendify-local'),
		},
		privacy: {
			url: 'https://openai.com/policies/privacy-policy/',
			text: __('Privacy Policy', 'extendify-local'),
		},
	};

	const createLink = (url, text) =>
		`<a href="${url}" target="_blank">${text}</a>`;

	const defaultConsentTermsHTML = sprintf(
		// translators: %1$s and %2$s are links
		__(
			'By using AI features, you agree to the OpenAI %1$s and %2$s.',
			'extendify-local',
		),
		createLink(links.terms.url, links.terms.text),
		createLink(links.privacy.url, links.privacy.text),
	);

	return (
		<div className="flex flex-col">
			<p
				className="m-0 mt-6 p-0 text-sm text-gray-700"
				dangerouslySetInnerHTML={{
					__html: consentTermsCustom || defaultConsentTermsHTML,
				}}
			/>
		</div>
	);
};
