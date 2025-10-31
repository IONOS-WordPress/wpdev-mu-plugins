import { Icon } from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import classNames from 'classnames';
import { magicAnimated, magic } from '@agent/icons';
import { useGlobalStore } from '@agent/state/global';

export const AdminBar = () => {
	const { toggleOpen, open, isMobile } = useGlobalStore();
	const [animate, setAnimate] = useState(false);
	const [animateIcon, setAnimateIcon] = useState(false);
	const pageLoaded = useRef(false);

	useEffect(() => {
		// Don't run this on the first page load
		if (!pageLoaded.current) {
			pageLoaded.current = true;
			return;
		}
		if (open || isMobile) return;
		setAnimate(true);
		setAnimateIcon(true);
		const id = setTimeout(() => {
			setAnimate(false);
		}, 1500);
		const iconId = setTimeout(() => {
			setAnimateIcon(false);
		}, 5000);
		return () => {
			clearTimeout(id);
			clearTimeout(iconId);
		};
	}, [open, isMobile]);

	if (isMobile) return null;

	return (
		<button
			type="button"
			className={classNames(
				'm-1 items-center justify-center rounded-sm border-0 bg-wp-theme-main p-0.5 px-1.5 leading-extra-tight text-white ring-offset-[#1D2327] focus:outline-none focus:ring-wp focus:ring-wp-theme-main focus:ring-offset-1 md:inline-flex',
				{
					'opacity-60': open,
				},
			)}
			onClick={() => {
				if (open) setAnimate(true);
				toggleOpen();
			}}
			aria-label={__('Open Agent', 'extendify-local')}>
			<Icon
				icon={animateIcon ? magicAnimated : magic}
				width={20}
				height={20}
				className={classNames('fill-design-text', {
					'scale-x-[-1]': isRTL(),
				})}
			/>
			<span
				className={classNames('px-1 leading-none', {
					'extendify-gradient-animation': animate,
				})}>
				{__('AI Agent', 'extendify-local')}
			</span>
		</button>
	);
};
