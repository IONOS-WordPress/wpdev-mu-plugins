import {
	BaseControl,
	Panel,
	PanelBody,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { generateImage } from '@shared/api/DataApi';
import { useImageGenerationStore } from '@shared/state/generate-images';
import { GenerateForm } from '@draft/components/image-generation/GenerateForm';
import { ImagePreview } from '@draft/components/image-generation/ImagePreview';
import { useRouter } from '@draft/hooks/useRouter';
import { pageState } from '@draft/state/factory';
import { backArrow } from '@draft/svg/BackArrow';

const usePageState = pageState('AI Image', (set) => ({
	imageDetails: { src: '', id: undefined },
	setImageDetails: (newState) => {
		set((state) => ({ ...state, imageDetails: newState }));
	},
}));

export const GenerateImage = () => {
	const {
		imageCredits: curCredits,
		updateImageCredits,
		subtractOneCredit,
		aiImageOptions,
	} = useImageGenerationStore();
	const [isGenerating, setIsGenerating] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const abortController = useRef(null);
	const noCredits = curCredits.remaining === 0;
	const { imageDetails, setImageDetails } = usePageState();
	const { goBack } = useRouter();

	const clearImageResponse = () => setImageDetails({ src: '', id: undefined });
	const handleSubmit = async (event) => {
		event.preventDefault();
		setErrorMessage('');
		if (noCredits) {
			abortController.current?.abort();
			return;
		}

		try {
			setIsGenerating(true);
			subtractOneCredit();
			abortController.current = new AbortController();
			const { imageCredits, images, id } = await generateImage(
				aiImageOptions,
				abortController.current.signal,
			);
			updateImageCredits(imageCredits);
			setImageDetails({ src: images[0].url, id });
		} catch (error) {
			// If the request was aborted (canceled), don't show an error
			if (error?.code === 20) return;
			// If we didn't get back any credit info, it was a server error
			if (!error?.imageCredits) {
				// Pause to prefent flickering
				await new Promise((resolve) => setTimeout(resolve, 1000));
				setErrorMessage(error.message);
				// Add back the credit we subtracted
				updateImageCredits({ remaining: curCredits.remaining });
				return;
			}
			// Probably out of credits here
			updateImageCredits(error.imageCredits);
			setErrorMessage(error.message);
		} finally {
			setIsGenerating(false);
		}
	};

	useEffect(() => {
		if (imageDetails.src || isGenerating) return;
		// refocus when image is removed
		document.getElementById('draft-ai-image-textarea')?.focus();
	}, [imageDetails.src, isGenerating]);

	return (
		<Panel>
			<div className="flex h-12 items-center gap-1 pl-1">
				<button
					className="h-9 w-9 border-0 bg-transparent"
					onClick={goBack}
					type="button"
					aria-label={__('Go Back', 'extendify-local')}>
					{backArrow}
				</button>
				<Heading className="mb-0">
					{__('AI Image Generator', 'extendify-local')}
				</Heading>
			</div>
			<PanelBody className="-mt-4 border-t-0">
				<BaseControl label={__('Image Description', 'extendify-local')}>
					<ImagePreview
						prompt={aiImageOptions.prompt}
						size={aiImageOptions.size}
						isGenerating={isGenerating}
						id={imageDetails?.id}
						src={imageDetails?.src}
						clearImageResponse={clearImageResponse}
					/>
					{imageDetails.src ? null : (
						<form onSubmit={handleSubmit} className="flex flex-col gap-5">
							<GenerateForm
								isGenerating={isGenerating}
								errorMessage={errorMessage}
							/>
						</form>
					)}
				</BaseControl>
			</PanelBody>
		</Panel>
	);
};

export const routes = [
	{
		slug: 'ai-image',
		title: __('AI Image', 'extendify-local'),
		component: GenerateImage,
	},
];
