import { __ } from '@wordpress/i18n';

export const RedirectThemeVariations = () => {
	return (
		<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
			<div className="rounded-lg border-b border-gray-300 bg-white p-3">
				<p className="m-0 p-0 text-sm text-gray-900">
					{__(
						'Hey there! It looks like you are trying to change your theme colors, but you are not on a page where we can do that.',
						'extendify-local',
					)}
				</p>
			</div>
			<div className="m-0 p-3 text-sm text-gray-900">
				{__('Suggestion:', 'extendify-local')}{' '}
				<a href={`${window.extSharedData.homeUrl}`}>
					{__('Home page', 'extendify-local')}
				</a>
			</div>
		</div>
	);
};
