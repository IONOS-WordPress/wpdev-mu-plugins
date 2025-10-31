import classNames from 'classnames';

export const CheckboxInput = ({
	label,
	slug,
	description,
	checked,
	onChange,
	locked = false,
}) => {
	return (
		<label
			className={classNames('flex items-center px-4 py-3.5', {
				'focus-within:text-design-main hover:text-design-main': !locked,
			})}
			htmlFor={slug}>
			<span className="relative mr-3 inline-block h-5 w-5 align-middle rtl:ml-3 rtl:mr-0">
				<input
					id={slug}
					className="m-0 h-5 w-5 rounded-sm"
					style={{
						'--ext-design-main': locked ? '#BBBBBB' : undefined,
					}}
					disabled={locked}
					type="checkbox"
					onChange={locked ? undefined : onChange}
					checked={locked ? true : checked}
				/>
				<svg
					className={classNames('absolute inset-0 block h-5 w-5', {
						'text-white': checked,
						'text-transparent': !checked,
					})}
					viewBox="1 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					role="presentation">
					<path
						d="M8.72912 13.7449L5.77536 10.7911L4.76953 11.7899L8.72912 15.7495L17.2291 7.24948L16.2304 6.25073L8.72912 13.7449Z"
						fill="currentColor"
					/>
				</svg>
			</span>
			<span className="flex grow flex-col overflow-hidden">
				<span className="truncate text-base font-medium leading-tight">
					{label}
				</span>
				{description ? (
					<span className="block pt-1">{description}</span>
				) : (
					<span />
				)}
			</span>
		</label>
	);
};
