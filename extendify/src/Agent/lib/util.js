export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export const makeId = () =>
	Date.now().toString(36) + Math.random().toString(36).slice(2);
