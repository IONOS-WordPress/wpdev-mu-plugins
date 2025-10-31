import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import classNames from 'classnames';
import { toolSelect } from '@agent/icons';
import { useWorkflowStore } from '@agent/state/workflows';

export const ChatTools = ({ disabled = false }) => {
	const { getWorkflowsByFeature, domToolEnabled, setDomToolEnabled } =
		useWorkflowStore();
	const domTool = getWorkflowsByFeature({ requires: ['block'] })?.length > 0;

	const handleClose = () => {
		window.dispatchEvent(new CustomEvent('extendify-agent:cancel-workflow'));
		setDomToolEnabled(!domToolEnabled);
	};

	if (!domTool) return null;
	return (
		<div className="flex items-center">
			<Tooltip
				text={
					domToolEnabled
						? __('Exit select mode', 'extendify-local')
						: __('Select Area to Edit', 'extendify-local')
				}>
				<button
					type="button"
					disabled={disabled}
					className={classNames(
						'm-0 flex items-center rounded border-0 px-1 py-0.5 leading-none disabled:opacity-50',
						{
							'bg-gray-300': domToolEnabled,
							'bg-gray-100 text-gray-900': !domToolEnabled,
							'hover:bg-gray-200': !disabled,
						},
					)}
					onClick={handleClose}>
					<Icon size={24} icon={toolSelect} />
					<span className="px-1">{__('Select', 'extendify-local')}</span>
					{domToolEnabled && (
						<Icon size={20} icon={closeSmall} className="fill-current" />
					)}
				</button>
			</Tooltip>
		</div>
	);
};
