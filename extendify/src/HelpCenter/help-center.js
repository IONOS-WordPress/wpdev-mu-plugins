import domReady from '@wordpress/dom-ready';
import { render } from '@shared/lib/dom';
import { isOnLaunch } from '@shared/lib/utils';
import { HelpCenter } from '@help-center/HelpCenter';
import '@help-center/app.css';
import '@help-center/buttons';

const isInsideIframe = () => !!document.querySelector('#plugin-information');

domReady(() => {
	if (isOnLaunch() || isInsideIframe()) return;
	const id = 'extendify-help-center-main';
	if (document.getElementById(id)) return;
	const helpCenter = Object.assign(document.createElement('div'), {
		className: 'extendify-help-center',
		id,
	});
	document.body.append(helpCenter);
	render(<HelpCenter />, helpCenter);
});
