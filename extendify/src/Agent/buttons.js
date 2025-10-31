import domReady from '@wordpress/dom-ready';
import { useEffect } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { render } from '@shared/lib/dom';
import { isOnLaunch } from '@shared/lib/utils';
import { AdminBar } from '@agent/components/buttons/AdminBar';
import { Mobile } from '@agent/components/buttons/Mobile';
import { PostEditor } from '@agent/components/buttons/PostEditor';

// TODO: Sometimes the admin bar is crowded, so a smarter way would be to do some analysis first and position these accordingly.

// Global toolbar
domReady(() => {
	if (isOnLaunch()) return;
	const id = 'wp-admin-bar-extendify-agent-btn';
	if (document.getElementById(id)) return;
	const agent = Object.assign(document.createElement('li'), {
		className: 'extendify-agent',
		id,
	});
	agent.style.height = '1.75rem';
	document.querySelector('#wp-admin-bar-my-account')?.before(agent);
	render(<AdminBar />, agent);
});

// Mobile
domReady(() => {
	if (isOnLaunch()) return;
	const id = 'extendify-agent-mobile-btn';
	if (document.getElementById(id)) return;
	const agent = Object.assign(document.createElement('div'), {
		className: 'extendify-agent',
		id,
	});
	agent.style.position = 'sticky';
	agent.style.top = 'calc(100% - var(--extendify-agent-mobile-btn-height))';
	agent.style.bottom = '0';
	agent.style.zIndex = '9999';
	document.body.appendChild(agent);
	render(<Mobile />, agent);
});

// In editor
registerPlugin('extendify-agent-buttons', {
	render: () => <AgentButton />,
});
const AgentButton = () => {
	useEffect(() => {
		if (isOnLaunch()) return;
		const id = 'extendify-agent-editor-btn';
		if (document.getElementById(id)) return;

		const agent = Object.assign(document.createElement('span'), {
			className: 'extendify-agent',
			id,
		});
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (document.getElementById(id)) return;
				const page = '[aria-controls="edit-post:document"]';
				const fse = '[aria-controls="edit-site:template"]';
				document.querySelector(page)?.after(agent);
				document.querySelector(fse)?.after(agent);
				render(<PostEditor />, agent);
			});
		});
	}, []);
	return null;
};
