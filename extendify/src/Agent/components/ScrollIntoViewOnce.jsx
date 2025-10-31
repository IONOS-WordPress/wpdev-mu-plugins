import { useRef, useEffect } from 'react';

export const ScrollIntoViewOnce = ({ children, ...props }) => {
	const ref = useRef(null);
	const once = useRef(false);

	useEffect(() => {
		if (!ref.current || once.current) return;
		const c = ref.current;
		// only scroll if 50% isnt visible
		const rect = c.getBoundingClientRect();
		const windowHeight =
			window.innerHeight || document.documentElement.clientHeight;
		const elementHeight = rect.height;
		const visibleTop = Math.max(rect.top, 0);
		const visibleBottom = Math.min(rect.bottom, windowHeight);
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		const visibleRatio = visibleHeight / elementHeight;

		if (visibleRatio >= 0.5) return;
		c.scrollIntoView({ behavior: 'smooth', block: 'end' });
		once.current = true;
	}, [props]);

	return (
		<div ref={ref} {...props}>
			{children}
		</div>
	);
};
