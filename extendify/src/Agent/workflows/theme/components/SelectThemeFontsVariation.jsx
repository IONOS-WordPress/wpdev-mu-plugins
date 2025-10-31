import { Tooltip } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ErrorMessage } from '@agent/components/ErrorMessage';
import { useFontVariationOverride } from '@agent/hooks/useFontVariationOverride';
import { useThemeFontsVariations } from '@agent/hooks/useThemeFontsVariations';

export const SelectThemeFontsVariation = ({ onConfirm, onCancel }) => {
	const [css, setCss] = useState('');
	const [selected, setSelected] = useState(null);
	const { undoChange } = useFontVariationOverride({ css });
	const { variations, isLoading } = useThemeFontsVariations();
	const noVariations = !variations || variations.length === 0;
	const shuffled = useMemo(
		() => (variations ? variations.sort(() => Math.random() - 0.5) : []),
		[variations],
	);

	const handleConfirm = () => {
		if (!selected) return;
		onConfirm({
			data: { variation: variations.find((v) => v.title === selected) },
		});
	};

	const handleCancel = () => {
		undoChange();
		onCancel();
	};

	if (isLoading) {
		return (
			<div className="min-h-24 p-2 text-center text-sm">
				{__('Loading font variations...', 'extendify-local')}
			</div>
		);
	}

	if (noVariations) {
		return (
			<ErrorMessage>
				<div className="font-semibold">
					{__('No font variations found', 'extendify-local')}
				</div>
				<div className="">
					{__(
						'We were unable to find any variations for your theme.',
						'extendify-local',
					)}
				</div>
			</ErrorMessage>
		);
	}

	return (
		<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
			<div className="rounded-lg border-b border-gray-300 bg-white">
				<div className="grid grid-cols-2 gap-2 p-3">
					{shuffled?.slice(0, 10)?.map(({ title, css, styles }) => (
						<Tooltip key={title} text={title} placement="top">
							<button
								aria-selected={selected === title}
								type="button"
								style={{ fontFamily: getFont(styles)?.normal }}
								className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-none p-2 text-center text-sm ${
									selected === title ? 'ring-wp ring-design-main' : ''
								}`}
								onClick={() => {
									setSelected(title);
									setCss(css);
								}}>
								<div className="max-w-fit content-stretch items-center justify-center rounded-lg text-2xl rtl:space-x-reverse">
									<span style={{ fontFamily: getFont(styles)?.heading }}>
										A
									</span>
									<span style={{ fontFamily: getFont(styles)?.normal }}>a</span>
								</div>
							</button>
						</Tooltip>
					))}
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
					disabled={!selected}
					onClick={handleConfirm}>
					{__('Save', 'extendify-local')}
				</button>
			</div>
		</div>
	);
};

const getFont = (styles) => {
	if (
		styles?.typography?.fontFamily &&
		styles?.elements?.heading?.typography?.fontFamily
	) {
		return {
			normal: styles.typography.fontFamily,
			heading:
				styles.elements.heading.typography.fontFamily ||
				styles.typography.fontFamily,
		};
	}

	if (styles?.typography?.fontFamily) {
		return {
			normal: styles.typography.fontFamily,
			heading: styles.typography.fontFamily,
		};
	}
};
