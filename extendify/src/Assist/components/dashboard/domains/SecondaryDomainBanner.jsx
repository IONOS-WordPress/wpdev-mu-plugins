import { __ } from '@wordpress/i18n';
import { Icon, globe, close } from '@wordpress/icons';
import { safeParseJson } from '@shared/lib/parsing';
import {
	domainSearchUrl,
	createDomainUrlLink,
	deleteDomainCache,
} from '@assist/lib/domains';
import { useDomainActivities } from '@assist/state/domain-activities';
import { useGlobalStore } from '@assist/state/globals';

const domains = safeParseJson(window.extSharedData.resourceData)?.domains || [];

export const SecondaryDomainBanner = () => {
	const { dismissBanner } = useGlobalStore();
	const { setDomainActivity } = useDomainActivities();

	if (!domainSearchUrl || !domains?.length) return null;

	return (
		<div
			className="relative mb-6 h-full min-h-32 w-full rounded border border-gray-300 bg-white px-5 py-5 text-base lg:px-8 lg:py-6"
			data-test="assist-domain-banner-secondary-domain-module">
			<button
				type="button"
				onClick={() => dismissBanner('secondary-domain-banner')}
				className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-bl rounded-se bg-gray-100 text-center hover:bg-gray-300 rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br">
				<Icon icon={close} size={32} className="fill-current" />
			</button>
			<div className="grid gap-4 md:grid-cols-2 md:gap-12">
				<div className="domain-name-message">
					<div className="text-lg font-semibold">
						{__('Add An Additional Domain', 'extendify-local')}
					</div>
					<div className="mt-1 text-sm">
						{__(
							'Having another domain can drive additional traffic to your website.',
							'extendify-local',
						)}
					</div>
				</div>
				<div className="domain-name-action">
					{!domains.length > 0 && (
						<div className="flex h-full items-center justify-center">
							{__('Service offline. Check back later.', 'extendify-local')}
						</div>
					)}

					{domains.length > 0 ? (
						<>
							<div className="mb-4 flex flex-col gap-1">
								<div className="flex items-center gap-1 font-semibold">
									<Icon icon={globe} size={24} className="fill-current" />
									{domains[0]}
								</div>
								<p className="m-0 p-0 text-sm">
									{__(
										// translators: this refers to a domain name
										'Available and just right for your site',
										'extendify-local',
									)}
								</p>
							</div>
							<a
								href={createDomainUrlLink(domainSearchUrl, domains[0])}
								onClick={() => {
									deleteDomainCache();
									setDomainActivity({
										domain: domains[0],
										position: 'addon-banner',
									});
								}}
								target="_blank"
								className="inline-flex h-10 cursor-pointer items-center rounded-sm bg-design-main px-4 text-sm text-design-text no-underline hover:opacity-90">
								{__('Secure a domain', 'extendify-local')}
							</a>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
};
