import classNames from 'classnames';
import { CheckboxInput } from '@launch/components/CheckboxInput';
import { PreviewIcon } from '@launch/svg';

export const PageSelectButton = ({
	page,
	previewing,
	onPreview,
	checked,
	onChange,
	forceChecked = false,
}) => (
	<div className="flex items-center rounded border border-gray-300">
		<div
			className={classNames('grow overflow-hidden text-gray-900', {
				'bg-gray-300': forceChecked,
			})}>
			<CheckboxInput
				label={page.name}
				slug={page.slug}
				checked={checked}
				onChange={onChange}
				locked={forceChecked}
			/>
		</div>

		<button
			type="button"
			className={classNames(
				'hidden h-full min-h-6 min-w-6 shrink items-center border-l border-gray-300 px-4 py-3 lg:flex',
				{
					'bg-gray-100 text-gray-800': !previewing,
					'bg-design-main text-white': previewing,
				},
			)}
			onClick={onPreview}>
			<PreviewIcon className="h-6 w-6" />
		</button>
	</div>
);
