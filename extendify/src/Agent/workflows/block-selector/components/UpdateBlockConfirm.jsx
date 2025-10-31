import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useWorkflowStore } from '@agent/state/workflows';

const dynamicClasses = ['is-style-outline'];

export const UpdateBlockConfirm = ({ inputs, onConfirm, onCancel }) => {
	const { block } = useWorkflowStore();
	const [loading, setLoading] = useState(true);
	const detachedEl = useRef(null);

	const handleConfirm = async () => {
		await onConfirm({ data: inputs, shouldRefreshPage: true });
	};

	const handleCancel = useCallback(() => {
		// remove the new block we added
		const el = document.querySelector('[data-extendify-temp-replacement]');
		// unhide the block
		if (detachedEl.current) {
			el?.parentNode?.insertBefore(detachedEl.current, el);
			detachedEl.current = null;
		}
		if (el) el.remove();
		onCancel();
	}, [onCancel]);

	useEffect(() => {
		apiFetch({
			path: '/extendify/v1/agent/get-block-html',
			method: 'POST',
			data: { blockCode: inputs.newContent },
		}).then(({ content }) => {
			// Remove the highlighter
			window.dispatchEvent(new Event('extendify-agent:remove-block-highlight'));
			// hide the block
			const el = document.querySelector(
				`[data-extendify-agent-block-id="${block.id}"]`,
			);
			// TODO: work out a way to propagate an error here
			if (!el) return onCancel();
			if (detachedEl.current) return; // already done
			detachedEl.current = el;

			const patched = patchVariantClasses(
				content,
				el.cloneNode(true),
				dynamicClasses,
			);

			const template = document.createElement('template');
			template.innerHTML = patched || '<div style="display:none"></div>';
			const newEl = template.content.firstElementChild;
			if (!newEl) return onCancel();
			newEl.setAttribute('data-extendify-temp-replacement', true);
			el.parentNode.insertBefore(newEl, el.nextSibling);
			el.parentNode?.removeChild(el);
			setLoading(false);
		});
	}, [block, inputs, onCancel]);

	if (loading)
		return (
			<Wrapper>
				<Content>{__('Loading...', 'extendify-local')}</Content>
			</Wrapper>
		);

	return (
		<Wrapper>
			<Content>
				<p className="m-0 p-0 text-sm text-gray-900">
					{__(
						'The agent has made the changes in the browser. Please review and confirm.',
						'extendify-local',
					)}
				</p>
			</Content>
			<div className="flex justify-start gap-2 p-3">
				<button
					type="button"
					className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
					onClick={handleCancel}>
					{__('Cancel', 'extendify-local')}
				</button>
				<button
					type="button"
					className="w-full rounded border border-design-main bg-design-main p-2 text-sm text-white"
					onClick={handleConfirm}>
					{__('Save', 'extendify-local')}
				</button>
			</div>
		</Wrapper>
	);
};

const Wrapper = ({ children }) => (
	<div className="mb-4 ml-10 mr-2 flex flex-col rounded-lg border border-gray-300 bg-gray-50 rtl:ml-2 rtl:mr-10">
		{children}
	</div>
);

const Content = ({ children }) => (
	<div className="rounded-lg border-b border-gray-300 bg-white">
		<div className="p-3">{children}</div>
	</div>
);

// escape for regex building
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getVariantNumbersInTree = (rootEl, base) => {
	if (!rootEl) return [];
	const re = new RegExp(`^${esc(base)}--(\\d+)$`, 'i');
	const out = [];
	const seen = new Set();
	// include root + descendants
	const all = [rootEl, ...rootEl.querySelectorAll(`[class*="${base}--"]`)];
	for (const el of all) {
		for (const cls of el.classList) {
			const m = cls.match(re);
			if (m) {
				const n = Number(m[1]);
				if (!seen.has(n)) {
					seen.add(n);
					out.push(n);
				}
			}
		}
	}
	return out; // e.g., [3,4]
};

const getVariantNumbersInHtml = (html, base) => {
	const wrapper = document.createElement('div');
	wrapper.innerHTML = html;
	return getVariantNumbersInTree(wrapper, base); // e.g., [1,2]
};

const applyVariantNumberMapToHtml = (html, base, numberMap) => {
	if (!numberMap || !numberMap.size) return html;
	const wrapper = document.createElement('div');
	wrapper.innerHTML = html;

	const reToken = new RegExp(`^${esc(base)}--(\\d+)$`, 'i');
	const ensureBase = base; // e.g. "is-style-outline"

	// target every element that *could* contain the class
	const els = wrapper.querySelectorAll(`[class*="${base}--"]`);
	els.forEach((el) => {
		const classes = Array.from(el.classList);
		let changed = false;

		for (let i = 0; i < classes.length; i++) {
			const m = classes[i].match(reToken);
			if (!m) continue;
			const oldN = Number(m[1]);
			if (numberMap.has(oldN)) {
				const newN = numberMap.get(oldN);
				const nextCls = `${base}--${newN}`;
				if (nextCls !== classes[i]) {
					classes[i] = nextCls;
					changed = true;
				}
			}
		}

		// keep the base style class too (e.g. "is-style-outline")
		if (!classes.includes(ensureBase)) {
			classes.push(ensureBase);
			changed = true;
		}

		if (changed) el.className = classes.join(' ');
	});

	return wrapper.innerHTML;
};

/**
 * This takes classes like "is-style-outline--N" and patches them to match the current DOM structure, since they are reordered by WP when parsing blocks.
 */
const patchVariantClasses = (html, el, bases) => {
	let out = html;
	bases.forEach((base) => {
		const targetNums = getVariantNumbersInTree(el, base); // e.g., [3,4]
		const currentNums = getVariantNumbersInHtml(out, base); // e.g., [1,2]
		if (!targetNums.length || !currentNums.length) return;

		// order-preserving mapping: 1->3, 2->4, ...
		const count = Math.min(targetNums.length, currentNums.length);
		const map = new Map();
		for (let i = 0; i < count; i++) map.set(currentNums[i], targetNums[i]);

		out = applyVariantNumberMapToHtml(out, base, map);
	});
	return out;
};
