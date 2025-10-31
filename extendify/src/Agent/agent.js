import domReady from '@wordpress/dom-ready';
import { render } from '@shared/lib/dom';
import { isOnLaunch } from '@shared/lib/utils';
import { Agent } from '@agent/Agent.jsx';
import '@agent/agent.css';
import '@agent/buttons';
import { GuidedTour } from '@agent/components/GuidedTour';
import { ReOpenToolTip } from '@agent/components/tooltip/ReOpenToolTip';

const isInsideIframe = () => !!document.querySelector('#plugin-information');

domReady(() => {
	const bg =
		// admin area
		document.getElementById('wpwrap') ||
		// TODO: is this on all block themes?
		document.querySelector('.wp-site-blocks');
	if (isOnLaunch() || isInsideIframe() || !bg) return;
	const id = 'extendify-agent-main';
	if (document.getElementById(id)) return;
	const agent = Object.assign(document.createElement('div'), {
		className: 'extendify-agent',
		id,
	});
	document.body.appendChild(agent);
	render(<Agent />, agent);
	// tours
	const tourId = 'extendify-agent-tour';
	if (document.getElementById(tourId)) return;
	const tour = Object.assign(document.createElement('div'), {
		className: 'extendify-agent-tour',
		id: tourId,
	});
	render(<GuidedTour />, tour);

	// tooltip
	const div = Object.assign(document.createElement('div'), {
		id: 'extendify-agent-modal-tooltip',
	});
	document.body.appendChild(div);
	render(<ReOpenToolTip />, div);
});
