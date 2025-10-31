import { useEffect, useState } from '@wordpress/element';

export const usePortal = (id) => {
	const [mounted, setMounted] = useState(null);

	useEffect(() => {
		let node = document.getElementById(id);
		if (!node) {
			node = Object.assign(document.createElement('div'), {
				className: 'extendify-agent',
			});
			node.id = id;
			document.getElementById('extendify-agent-main').prepend(node);
		}
		setMounted(node);
		return () => node.remove();
	}, [id]);

	return mounted;
};
