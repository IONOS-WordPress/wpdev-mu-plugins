import { __ } from '@wordpress/i18n';
import { ToolTip } from '@agent/components/tooltip/ToolTip';

export const ReOpenToolTip = () => {
	return (
		<ToolTip
			name="reopen"
			title={__('Tooltip pointing to the agent button', 'extendify-local')}
			anchors={[
				'#extendify-agent-editor-btn > button',
				'#wp-admin-bar-extendify-agent-btn',
			]}>
			<div className="mb-1 text-base font-semibold">
				{__('Need help again?', 'extendify-local')}
			</div>
			<div className="text-base">
				{__(
					'You can always access your AI Agent if you need help with anything on your site.',
					'extendify-local',
				)}
			</div>
		</ToolTip>
	);
};
