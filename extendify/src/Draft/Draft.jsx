import { store as blockEditorStore } from '@wordpress/block-editor';
import { BaseControl, Panel, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useAIConsentStore } from '@shared/state/ai-consent';
import { Completion } from '@draft/components/Completion';
import { ConsentSidebar } from '@draft/components/ConsentSidebar';
import { DraftMenu } from '@draft/components/DraftMenu';
import { EditMenu } from '@draft/components/EditMenu';
import { Input } from '@draft/components/Input';
import { InsertMenu } from '@draft/components/InsertMenu';
import { SelectedText } from '@draft/components/SelectedText';
import { useCompletion } from '@draft/hooks/useCompletion';
import { useRouter } from '@draft/hooks/useRouter';
import { useSelectedText } from '@draft/hooks/useSelectedText';

export const Draft = () => {
	const { selectedText } = useSelectedText();
	const [inputText, setInputText] = useState('');
	const [ready, setReady] = useState(false);
	const [prompt, setPrompt] = useState({
		text: '',
		promptType: '',
		systemMessageKey: '',
		details: {},
	});
	const { completion, loading, error } = useCompletion(
		prompt.text,
		prompt.promptType,
		prompt.systemMessageKey,
		prompt.details,
	);
	const { selectedBlockClientIds, getBlock } = useSelect((select) => {
		const blockEditor = select(blockEditorStore);
		return {
			selectedBlockClientIds: blockEditor.getSelectedBlockClientIds(),
			getBlock: blockEditor.getBlock,
			getBlocks: blockEditor.getBlocks,
		};
	}, []);

	const { CurrentPage: PhotosSection } = useRouter();
	// TODO: move to global state
	const shouldShowAIConsent = useAIConsentStore((state) =>
		state.shouldShowAIConsent('draft'),
	);

	// TODO: When doing a rewrite, make this global state
	useEffect(() => {
		// Allow for external updates
		const handle = (event) => {
			if (shouldShowAIConsent) return;
			setPrompt(event.detail);
		};
		window.addEventListener('extendify-draft:set-prompt', handle);
		return () =>
			window.removeEventListener('extendify-draft:set-prompt', handle);
	}, [shouldShowAIConsent]);

	// Reset input text when an error occurs
	useEffect(() => {
		if (!error) return;
		setInputText(prompt.text);
	}, [error, prompt.text]);

	const canEditContent = () => {
		if (selectedBlockClientIds.length === 0) {
			return false;
		}
		const targetBlock = getBlock(selectedBlockClientIds[0]);
		if (!targetBlock) {
			return false;
		}
		return (
			typeof targetBlock?.attributes?.content !== 'undefined' &&
			targetBlock?.attributes?.content !== ''
		);
	};

	const isImageBlock = () => {
		if (selectedBlockClientIds.length === 0) return false;

		const supportedBlocks = [
			'core/image',
			'core/media-text',
			'core/gallery',
			'core/cover',
		];
		const targetBlock = getBlock(selectedBlockClientIds[0]);
		if (!targetBlock) return false;

		return supportedBlocks.includes(targetBlock.name);
	};

	if (shouldShowAIConsent) {
		return <ConsentSidebar />;
	}

	if (isImageBlock()) return <PhotosSection />;

	return (
		<>
			<Panel>
				<PanelBody>
					{selectedText && <SelectedText loading={loading} />}

					<div className="mb-4 overflow-hidden rounded-sm border-none bg-gray-100">
						{!completion && (
							<Input
								inputText={inputText}
								setInputText={setInputText}
								ready={ready}
								setReady={setReady}
								setPrompt={setPrompt}
								loading={loading}
							/>
						)}
						{completion && <Completion completion={completion} />}
						{error && (
							<div className="mb-4 mt-2 px-4">
								<p className="m-0 text-xs font-semibold text-red-500">
									{error.message}
								</p>
							</div>
						)}
					</div>
					{(completion || loading) && !error && (
						<InsertMenu
							prompt={prompt}
							completion={completion}
							setPrompt={setPrompt}
							setInputText={setInputText}
							loading={loading}
						/>
					)}
					{!loading && !completion && canEditContent() && (
						<BaseControl>
							<EditMenu
								completion={completion}
								disabled={loading}
								setInputText={setInputText}
								setPrompt={setPrompt}
							/>
						</BaseControl>
					)}
					{!loading && !completion && !canEditContent() && (
						<BaseControl label={__('Suggested prompts', 'extendify-local')}>
							<DraftMenu
								disabled={loading}
								setInputText={setInputText}
								setReady={setReady}
							/>
						</BaseControl>
					)}
				</PanelBody>
			</Panel>
			{window.extSharedData?.devbuild && (
				<Panel>
					<PanelBody title="Debug" initialOpen={false}>
						<label>prompt text:</label>
						<pre className="whitespace-pre-wrap">{prompt.text}</pre>
						<label>prompt system message:</label>
						<pre className="whitespace-pre-wrap">{prompt.systemMessageKey}</pre>
						<label>completion:</label>
						<pre className="whitespace-pre-wrap">{completion}</pre>
						<label>error:</label>
						<pre className="whitespace-pre-wrap">{error?.message ?? ''}</pre>
						<label>
							loading: {loading ? <span>true</span> : <span>false</span>}
						</label>
					</PanelBody>
				</Panel>
			)}
		</>
	);
};
