export const mergeRequiredPlugins = (aiSuggestedPlugins) => {
	const partnerRequiredPluginsRaw = window.extSharedData?.requiredPlugins;
	if (
		!partnerRequiredPluginsRaw ||
		!Array.isArray(partnerRequiredPluginsRaw) ||
		partnerRequiredPluginsRaw.length === 0
	) {
		return aiSuggestedPlugins;
	}

	const partnerRequiredPlugins = partnerRequiredPluginsRaw.map((plugin) => ({
		name: plugin?.name,
		wordpressSlug: plugin?.wordpressSlug,
	}));

	return [
		...aiSuggestedPlugins,
		...partnerRequiredPlugins.filter(
			(plugin) =>
				!aiSuggestedPlugins.some(
					(suggested) => suggested.wordpressSlug === plugin.wordpressSlug,
				),
		),
	];
};
