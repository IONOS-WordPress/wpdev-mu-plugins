import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
import { selectedContent } from '@agent/icons';
import { useWorkflowStore } from '@agent/state/workflows';

export const PageDocument = ({ busy }) => {
	const { setBlock } = useWorkflowStore();
	return (
		<div className="flex w-fit items-center justify-start gap-1 rounded border border-gray-500 bg-gray-100 p-1 text-sm text-gray-900">
			<div className="flex items-center gap-1">
				<Icon icon={selectedContent} />
				<div>{__('Selected content', 'extendify-local')}</div>
			</div>
			<Tooltip text={__('Remove', 'extendify-local')}>
				<button
					type="button"
					disabled={busy}
					className="flex h-full items-center rounded-none border-0 bg-transparent outline-none ring-design-main focus:shadow-none focus:outline-none focus-visible:outline-design-main"
					onClick={() => setBlock(null)}>
					<Icon
						className="pointer-events-none fill-current leading-none"
						icon={close}
						size={18}
					/>
					<span className="sr-only">{__('Remove', 'extendify-local')}</span>
				</button>
			</Tooltip>
		</div>
	);
};
