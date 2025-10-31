import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const UpdatePostConfirm = ({ inputs, onConfirm, onCancel }) => {
	const handleConfirm = () => {
		onConfirm({ data: inputs });
	};

	const handleCancel = useCallback(() => {
		const replacements = inputs.replacements || [];
		const reversed = replacements.map(({ original, updated }) => ({
			original: updated,
			updated: original,
		}));
		onCancel();
		updateAllTextNodesAndAttributes(reversed);
	}, [inputs, onCancel]);

	useEffect(() => {
		updateAllTextNodesAndAttributes(inputs.replacements);
	}, [inputs.replacements]);

	return (
		<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
			<div className="rounded-lg border-b border-gray-300 bg-white">
				<div className="p-3">
					<p className="m-0 p-0 text-sm text-gray-900">
						{__(
							'The agent has made the changes in the browser. Please review and confirm.',
							'extendify-local',
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
					{__('Save', 'extendify-local')}
				</button>
			</div>
		</div>
	);
};

const updateAllTextNodesAndAttributes = (replacements) => {
	const chat = document.getElementById('extendify-agent-chat');
	const isInChat = (node) => chat && chat.contains(node);
	// Update all text nodes
	const walker = document.createTreeWalker(
		document.body,
		NodeFilter.SHOW_TEXT,
		null,
		false,
	);
	let node;
	while ((node = walker.nextNode())) {
		// Skip nodes that are inside the chat
		if (isInChat(node.parentNode)) continue;
		replacements?.forEach(({ original, updated }) => {
			if (node.nodeValue.includes(original)) {
				node.nodeValue = node.nodeValue.split(original).join(updated);
			}
		});
	}

	// Update attributes
	['alt', 'title', 'aria-label'].forEach((attr) => {
		document.querySelectorAll(`[${attr}]`).forEach((el) => {
			// Skip elements that are inside the chat
			if (isInChat(el)) return;
			replacements?.forEach(({ original, updated }) => {
				const val = el.getAttribute(attr);
				if (val && val.includes(original)) {
					el.setAttribute(attr, val.split(original).join(updated));
				}
			});
		});
	});
};
