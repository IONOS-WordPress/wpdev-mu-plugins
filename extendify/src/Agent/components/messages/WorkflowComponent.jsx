import { __ } from '@wordpress/i18n';
import { ErrorMessage } from '@agent/components/ErrorMessage';
import { workflows } from '@agent/workflows/workflows';

export const WorkflowComponent = ({ message }) => {
	const Component = workflows.find((w) => w.id === message.details.id)
		?.whenFinished?.component;

	if (!Component) return <Error />;
	return <Component {...message.details} />;
};

const Error = () => (
	<ErrorMessage>
		<div className="text-sm">
			<div className="font-semibold">
				{__('Component not available', 'extendify-local')}
			</div>
			<div className="">
				{__(
					// translators: This is for when a component doesn't exist
					'It may have been removed or is not available for your account.',
					'extendify-local',
				)}
			</div>
		</div>
	</ErrorMessage>
);
