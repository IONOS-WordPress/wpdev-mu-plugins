import { useEffect, useState } from '@wordpress/element';
import {
	styles,
	edit,
	help,
	chevronRight,
	video,
	drafts,
	published,
	typography,
} from '@wordpress/icons';
import { sparkle } from '@agent/icons';
import { useTourStore } from '@agent/state/tours';
import tours from '@agent/tours/tours';

const { suggestions } = window.extAgentData;
const availableTours = Object.values(tours).filter(
	({ settings: { startFrom } }) =>
		!startFrom || startFrom.includes(window.location.href),
);
const randomTour = availableTours?.length
	? availableTours[Math.floor(Math.random() * availableTours.length)]
	: undefined;
// 30% chance to show the tour suggestion unless there are less than 3 tours
const showTour =
	randomTour?.message && (suggestions.length < 3 || Math.random() < 0.3);

const icons = {
	styles,
	edit,
	help,
	video,
	sparkle,
	drafts,
	published,
	typography,
};

const featured = suggestions.filter((s) => !!s?.feature);
const standard = suggestions.filter((s) => !s?.feature);

export const ChatSuggestions = () => {
	const { startTour } = useTourStore();
	const [shuffled, setShuffled] = useState(standard);

	useEffect(() => {
		setShuffled((prev) => prev.toSorted(() => Math.random() - 0.5));
	}, []);

	const handleSubmit = (message) => {
		window.dispatchEvent(
			new CustomEvent('extendify-agent:chat-submit', {
				detail: { message },
			}),
		);
	};

	return (
		<>
			{showTour ? (
				<SuggestionButton
					key={randomTour.message}
					suggestion={{ ...randomTour, icon: 'video' }}
					handleSubmit={() => startTour(randomTour)}
				/>
			) : null}

			{[...featured, ...shuffled]
				.slice(0, showTour ? 2 : 3)
				.map((suggestion) => (
					<SuggestionButton
						key={suggestion.message}
						suggestion={suggestion}
						handleSubmit={handleSubmit}
					/>
				))}
		</>
	);
};

const SuggestionButton = ({ suggestion, handleSubmit }) => {
	const icon = icons[suggestion?.icon] ?? icons.sparkle;
	return (
		<button
			type="button"
			className="group flex items-center justify-between rounded bg-transparent px-1 py-1 text-left text-sm text-gray-900 transition-colors duration-100 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-design-main"
			onClick={() => handleSubmit(suggestion.message)}>
			<div className="flex items-center gap-1.5 leading-none">
				<span className="h-5 w-5 flex-shrink-0 self-start fill-gray-700">
					{icon}
				</span>
				<span className="leading-5">{suggestion.message}</span>
			</div>
			<span className="inline-block h-5 w-5 fill-gray-700 leading-none opacity-0 transition-opacity duration-100 group-hover:opacity-100 rtl:scale-x-[-1]">
				{chevronRight}
			</span>
		</button>
	);
};
