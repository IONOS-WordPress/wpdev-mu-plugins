import { __ } from '@wordpress/i18n';
import { ChatSuggestions } from '@agent/components/ChatSuggestions';
import { Rating } from '@agent/components/Rating';

// Note: this used to have more status like joined, cancelled, transferred etc.
export const WorkflowMessage = ({ message }) => {
	const { status, answerId } = message.details;

	return (
		<div className="flex flex-col gap-px p-2 text-center text-xs italic">
			{answerId && <Rating answerId={answerId} />}
			{['completed', 'canceled'].includes(status) ? (
				<div className="relative mb-4 ml-9 mr-2 mt-4 flex flex-col gap-0.5 border-t border-gray-300 p-0 pt-4 text-sm text-gray-800 rtl:ml-2 rtl:mr-9">
					<p className="m-0 mb-2 p-0 px-2 text-left text-sm not-italic text-gray-900 rtl:text-right">
						{__(
							"What's next? Would you like to do something else?",
							'extendify-local',
						)}
					</p>
					<ChatSuggestions />
				</div>
			) : null}
		</div>
	);
};
