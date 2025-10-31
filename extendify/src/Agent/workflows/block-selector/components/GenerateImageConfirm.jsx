import { registerCoreBlocks } from '@wordpress/block-library';
import { Spinner } from '@wordpress/components';
import { humanTimeDiff } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { generateImage } from '@shared/api/DataApi';
import { downloadImage } from '@shared/api/wp';
import { useImageGenerationStore } from '@shared/state/generate-images';
import { motion } from 'framer-motion';
import { ErrorMessage } from '@agent/components/ErrorMessage';
import { walkAndUpdateImageDetails } from '@agent/lib/blocks';

const openButton = __('Generate Image', 'extendify-local');
const preload = (src) =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(src);
		img.onerror = reject;
		img.src = src;
	});

export const GenerateImageConfirm = ({ inputs, onConfirm, onCancel }) => {
	const [generatedImage, setGeneratedImage] = useState(null);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [refreshCheck, setRefreshCheck] = useState(0);
	const [importing, setImporting] = useState(false);
	const {
		imageCredits,
		updateImageCredits,
		subtractOneCredit,
		resetImageCredits,
	} = useImageGenerationStore();
	const noCredits = Number(imageCredits.remaining) === 0;

	const handleConfirm = async () => {
		if (importing) return;
		if (!generatedImage) {
			setGenerating(true);
			subtractOneCredit();
			try {
				const { imageCredits, images } = await generateImage({
					prompt: inputs.prompt,
				});
				updateImageCredits(imageCredits);
				const url = images?.[0]?.url;
				if (!url) throw new Error(__('No image returned', 'extendify-local'));
				await preload(url);
				setGeneratedImage(url);
				setGenerating(false);
			} catch (e) {
				setError(
					e?.message || __('An unknown error occurred.', 'extendify-local'),
				);
				if (e?.imageCredits) updateImageCredits(e.imageCredits);
				setGenerating(false);
			}
			return;
		}
		setImporting(true);
		const importedImage = await downloadImage(
			null,
			generatedImage,
			'ai-generated',
		);
		await onConfirm({
			data: {
				previousContent: inputs.previousContent,
				newContent: walkAndUpdateImageDetails(inputs, importedImage),
			},
			shouldRefreshPage: true,
		});
	};

	useEffect(() => {
		// rawHandler does not work on the frontend, so we need to register the
		// core blocks again to get it working.
		registerCoreBlocks();
	}, []);

	// Copied from Draft. Maybe not the best way to do this.
	useEffect(() => {
		const handle = () => {
			setRefreshCheck((prev) => prev + 1);
			if (!imageCredits.refresh) return;
			if (new Date(Number(imageCredits.refresh)) > new Date()) return;
			resetImageCredits();
		};
		if (refreshCheck === 0) handle(); // First run
		const id = setTimeout(handle, 1000);
		return () => clearTimeout(id);
	}, [imageCredits, resetImageCredits, refreshCheck]);

	useEffect(() => {
		if (!error) return;
		const timer = setTimeout(() => onCancel(), 5000);
		return () => clearTimeout(timer);
	}, [error, onCancel]);

	if (error) {
		return (
			<ErrorMessage>
				<div className="text-sm">
					<div className="font-semibold">
						{__('Error generating image', 'extendify-local')}
					</div>
					<div>{error}</div>
				</div>
			</ErrorMessage>
		);
	}

	if (generating) {
		return (
			<Wrapper>
				<Content>
					<motion.div
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="flex aspect-square w-full items-center justify-center"
						style={{
							background:
								'linear-gradient(135deg, #E8E8E8 47.92%, #F3F3F3 60.42%, #E8E8E8 72.92%)',
						}}>
						<Spinner style={{ height: '48px', width: '48px' }} />
					</motion.div>
				</Content>
			</Wrapper>
		);
	}

	if (generatedImage) {
		return (
			<Wrapper>
				<Content>
					<p className="m-0 p-0 text-sm text-gray-900">
						{__('Image generated successfully!', 'extendify-local')}
					</p>
					<div className="my-2 flex justify-center">
						<img
							src={generatedImage}
							alt={inputs.prompt}
							style={{ maxWidth: '100%', height: 'auto' }}
						/>
					</div>
				</Content>
				<div className="flex justify-start gap-2 p-3">
					<button
						type="button"
						className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
						disabled={importing}
						onClick={onCancel}>
						{__('Cancel', 'extendify-local')}
					</button>
					<button
						type="button"
						className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
						disabled={importing}
						onClick={handleConfirm}>
						{importing
							? __('Inserting Image...', 'extendify-local')
							: __('Insert Image', 'extendify-local')}
					</button>
				</div>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<Content>
				<p className="m-0 p-0 text-sm text-gray-900">
					{noCredits
						? sprintf(
								__(
									"You've used all your image credits for today. Your credits will reset in %s.",
									'extendify-local',
								),
								humanTimeDiff(new Date(Number(imageCredits.refresh))),
							)
						: sprintf(
								__(
									'The agent has asked to generate an image. Press "%s" to continue.',
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
				{noCredits ? null : (
					<button
						type="button"
						className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
						disabled={noCredits}
						onClick={handleConfirm}>
						{openButton}
					</button>
				)}
			</div>
			<div className="text-pretty px-4 pb-2 text-center text-xss leading-none text-gray-700">
				{sprintf(
					// translators: %1$s is the number of credits remaining, %2$s is the total credits
					__(
						'You have %1$s of %2$s daily image credits remaining.',
						'extendify-local',
					),
					imageCredits.remaining,
					imageCredits.total,
				)}
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
