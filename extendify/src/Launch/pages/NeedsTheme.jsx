import { __ } from '@wordpress/i18n';
import { Title } from '@launch/components/Title';
import { PageLayout } from '@launch/layouts/PageLayout';

export const NeedsTheme = () => {
	return (
		<PageLayout includeNav={false}>
			<div className="grow overflow-y-auto px-6 py-8 md:p-12 3xl:p-16">
				<Title
					title={__('One more thing before we start.', 'extendify-local')}
				/>
				<div className="relative mx-auto w-full max-w-xl">
					<p className="text-base">
						{__(
							'Hey there, Launch is powered by Extendable and is required to proceed. You can install it from the link below and start over once activated.',
							'extendify-local',
						)}
					</p>
					<a
						className="mt-4 text-base font-medium text-design-main underline"
						href={`${window.extSharedData.adminUrl}theme-install.php?theme=extendable`}>
						{__('Take me there', 'extendify-local')}
					</a>
				</div>
			</div>
		</PageLayout>
	);
};
