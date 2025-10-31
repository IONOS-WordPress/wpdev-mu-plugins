import { Tooltip } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ErrorMessage } from '@agent/components/ErrorMessage';
import { useThemeVariations } from '@agent/hooks/useThemeVariations';
import { useVariationOverride } from '@agent/hooks/useVariationOverride';

export const SelectThemeVariation = ({ onConfirm, onCancel }) => {
	const [css, setCss] = useState('');
	const [selected, setSelected] = useState(null);
	const [duotoneTheme, setDuotoneTheme] = useState(null);
	const { undoChange } = useVariationOverride({ css, duotoneTheme });
	const { variations, isLoading } = useThemeVariations();
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
				{__('Loading variations...', 'extendify-local')}
			</div>
		);
	}
	if (noVariations) {
		return (
			<ErrorMessage>
				<div className="font-semibold">
					{__('No variations found', 'extendify-local')}
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
					{shuffled?.slice(0, 10)?.map(({ title, css, settings }) => (
						<Tooltip key={title} text={title} placement="top">
							<button
								style={{ backgroundColor: getColor(settings, 'background') }}
								type="button"
								className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-none p-2 text-center text-sm ${
									selected === title ? 'ring-wp ring-design-main' : ''
								}`}
								onClick={() => {
									setSelected(title);
									setCss(css);
									setDuotoneTheme(settings?.color?.duotone?.theme);
								}}>
								<div className="flex max-w-fit items-center justify-center -space-x-4 rounded-lg rtl:space-x-reverse">
									{getColors(settings)?.map((color, i) => (
										<div
											key={title + color + i}
											style={{ backgroundColor: color }}
											className="size-6 flex-shrink-0 overflow-visible rounded-full border border-white md:size-7"></div>
									))}
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

const getColor = (settings, colorName) => {
	return settings?.color?.palette?.theme.find((item) => item.slug === colorName)
		?.color;
};

const getColors = (settings) => {
	return settings?.color?.palette?.theme
		?.filter((item) => item.slug !== 'background')
		?.reduce((acc, item) => {
			acc.push(item.color);
			return acc;
		}, []);
};
