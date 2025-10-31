import { registerCoreBlocks } from '@wordpress/block-library';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { MediaUpload } from '@wordpress/media-utils';
import { walkAndUpdateImageDetails } from '@agent/lib/blocks';

const openButton = __('Open Media Library', 'extendify-local');

export const UpdateImageConfirm = ({ inputs, onConfirm, onCancel }) => {
	const handleConfirm = async (image) => {
		await onConfirm({
			data: {
				previousContent: inputs.previousContent,
				newContent: walkAndUpdateImageDetails(inputs, image),
			},
			shouldRefreshPage: true,
		});
	};

	useEffect(() => {
		// rawHandler does not work on the frontend, so we need to register the
		// core blocks again to get it working.
		registerCoreBlocks();
	}, []);

	useEffect(() => {
		// Put modal above the Agent
		const style = document.createElement('style');
		style.textContent = `.media-modal {
			z-index: 999999 !important;
		}`;
		document.head.appendChild(style);
		return () => style.remove();
	}, []);

	return (
		<Wrapper>
			<Content>
				<p className="m-0 p-0 text-sm text-gray-900">
					{sprintf(
						__(
							'The agent has requested the media library. Press "%s" to upload or select an image.',
							'extendify-local',
						),
						openButton,
					)}
				</p>
			</Content>
			<div className="flex justify-start gap-2 p-3">
				<button
					type="button"
					className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
					onClick={onCancel}>
					{__('Cancel', 'extendify-local')}
				</button>
				<MediaUpload
					title={__('Select or Upload Image', 'extendify-local')}
					onSelect={handleConfirm}
					allowedTypes={['image']}
					modalClass="image__media-modal"
					render={({ open }) => (
						<button
							type="button"
							className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
							onClick={open}>
							{openButton}
						</button>
					)}
				/>
			</div>
		</Wrapper>
	);
};

const Wrapper = ({ children }) => (
	<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
		{children}
	</div>
);

const Content = ({ children }) => (
	<div className="rounded-lg border-b border-gray-300 bg-white">
		<div className="p-3">{children}</div>
	</div>
);
