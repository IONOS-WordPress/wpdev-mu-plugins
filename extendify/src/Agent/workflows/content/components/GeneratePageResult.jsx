import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const { homeUrl } = window.extSharedData || {};

export const GeneratePageResult = ({ inputs, onConfirm }) => {
	const handleConfirm = useCallback(() => {
		if (inputs.postId) {
			window.open(`${homeUrl}/?page_id=${inputs.postId}`, '_self');
		}
		onConfirm();
	}, [inputs.postId, onConfirm]);

	return (
		<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
			<div className="rounded-lg border-b border-gray-300 bg-white">
				<div className="p-3">
					<p className="m-0 p-0 text-sm text-gray-900">
						{__(
							'The agent has finished creating your page. Press take me there to visit your new page or dismiss to remove this notice.',
							'extendify-local',
						)}
					</p>
				</div>
			</div>
			<div className="flex justify-start gap-2 p-3">
				<button
					type="button"
					className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
					onClick={onConfirm}>
					{__('Dismiss', 'extendify-local')}
				</button>
				<button
					type="button"
					className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
					onClick={handleConfirm}>
					{__('Take me there', 'extendify-local')}
				</button>
			</div>
		</div>
	);
};
