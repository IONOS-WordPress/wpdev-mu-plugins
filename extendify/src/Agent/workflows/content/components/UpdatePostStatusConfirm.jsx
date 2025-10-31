import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

export const UpdatePostStatusConfirm = ({ inputs, onConfirm, onCancel }) => {
	const handleConfirm = () => {
		if (window && window.extAgentData && window.extAgentData.context) {
			window.extAgentData.context.postStatus = inputs.updatedStatus;
		}
		onConfirm({ data: inputs });
	};

	const handleCancel = useCallback(() => {
		onCancel();
	}, [onCancel]);

	return (
		<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
			<div className="rounded-lg border-b border-gray-300 bg-white">
				<div className="p-3">
					<p className="m-0 p-0 text-sm text-gray-900">
						{sprintf(
							// translators: %1$s is the post type,  %2$s the current page or post status, and %3$s is the updated page or post status.
							__(
								'We are going to change the status of the %1$s from "%2$s" to "%3$s". Please confirm.',
								'extendify-local',
							),
							inputs.postType,
							inputs.postStatus,
							inputs.updatedStatus,
						)}
					</p>
				</div>
			</div>
			<div className="flex justify-start gap-2 p-3">
				<button
					type="button"
					className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
					onClick={handleCancel}>
					{__('Cancel', 'extendify-local')}
				</button>
				<button
					type="button"
					className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
					onClick={handleConfirm}>
					{__('Confirm', 'extendify-local')}
				</button>
			</div>
		</div>
	);
};
