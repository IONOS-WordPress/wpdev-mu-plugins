const workflowContext = require.context(
	'.',
	true,
	// Exclude this file and anything in tools/ or components/
	/^(?!.*\/(tools|components)\/)(?!\.\/workflows\.js$).*\.js$/,
);
export const workflows = workflowContext
	.keys()
	.filter((key) => key !== './workflows.js')
	.map((key) => workflowContext(key).default || workflowContext(key));

// Dynamically pull in all tools
const toolContext = require.context('.', true, /tools\/.*\.js$/);
export const tools = toolContext.keys().reduce((acc, key) => {
	const id = key.split('/').pop().replace('.js', '');
	acc[id] = toolContext(key).default || toolContext(key);
	return acc;
}, {});
