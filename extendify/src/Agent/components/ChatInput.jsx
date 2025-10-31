import {
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, arrowUp } from '@wordpress/icons';
import classNames from 'classnames';
import { ChatTools } from '@agent/components/ChatTools';
import { useGlobalStore } from '@agent/state/global';
import { useWorkflowStore } from '@agent/state/workflows';

export const ChatInput = ({ disabled, handleSubmit }) => {
	const textareaRef = useRef(null);
	const [input, setInput] = useState('');
	const [history, setHistory] = useState([]);
	const dirtyRef = useRef(false);
	const [historyIndex, setHistoryIndex] = useState(null);
	const { getWorkflowsByFeature, block } = useWorkflowStore();
	const { isMobile } = useGlobalStore();
	const domTool =
		getWorkflowsByFeature({ requires: ['block'] })?.length > 0 && !isMobile;

	// resize the height of the textarea based on the content
	const adjustHeight = useCallback(() => {
		if (!textareaRef.current) return;
		textareaRef.current.style.height = 'auto';
		const chat =
			textareaRef.current.closest('#extendify-agent-chat').offsetHeight * 0.55;
		const h = Math.min(chat, textareaRef.current.scrollHeight);
		textareaRef.current.style.height = `${block && h < 60 ? 60 : h}px`;
	}, [block]);

	useLayoutEffect(() => {
		window.addEventListener('extendify-agent:resize-end', adjustHeight);
		adjustHeight();
		return () =>
			window.removeEventListener('extendify-agent:resize-end', adjustHeight);
	}, [adjustHeight]);

	useEffect(() => {
		const watchForSubmit = ({ detail }) => {
			setHistory((prev) => {
				// avoid duplicates
				if (prev?.at(-1) === detail.message) return prev;
				return [...prev, detail.message];
			});
			setHistoryIndex(null);
		};
		window.addEventListener('extendify-agent:chat-submit', watchForSubmit);
		return () =>
			window.removeEventListener('extendify-agent:chat-submit', watchForSubmit);
	}, []);

	useEffect(() => {
		adjustHeight();
	}, [input, adjustHeight]);

	useEffect(() => {
		const userMessages = Array.from(
			document.querySelectorAll(
				'#extendify-agent-chat-scroll-area > [data-agent-message-role="user"]',
			),
		)?.map((el) => el.textContent || '');
		const deduped = userMessages.filter(
			(msg, i, arr) => i === 0 || msg !== arr[i - 1],
		);
		setHistory(deduped);
	}, []);

	const submitForm = useCallback(
		(e) => {
			e?.preventDefault();
			if (!input.trim()) return;
			handleSubmit(input);
			setHistory((prev) => {
				// avoid duplicates
				if (prev?.at(-1) === input) return prev;
				return [...prev, input];
			});
			setHistoryIndex(null);
			setInput('');
			requestAnimationFrame(() => {
				dirtyRef.current = false;
				adjustHeight();
				textareaRef.current?.focus();
			});
		},
		[input, handleSubmit, adjustHeight],
	);

	const handleKeyDown = useCallback(
		(event) => {
			if (
				event.key === 'Enter' &&
				!event.shiftKey &&
				!event.nativeEvent.isComposing
			) {
				event.preventDefault();
				submitForm();
				return;
			}
			if (dirtyRef.current) return;
			if (event.key === 'ArrowUp') {
				if (!history.length) return;
				if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
					return;
				setHistoryIndex((prev) => {
					const next =
						prev === null ? history.length - 1 : Math.max(prev - 1, 0);
					setInput(history[next]);
					return next;
				});
				event.preventDefault();
				return;
			}
			if (event.key === 'ArrowDown') {
				if (historyIndex === null) return;
				if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
					return;
				setHistoryIndex((prev) => {
					if (prev === null) return null;
					const next = prev + 1;
					if (next >= history.length) {
						setInput('');
						return null;
					}
					setInput(history[next]);
					return next;
				});
				event.preventDefault();
				return;
			}
			dirtyRef.current = true;
		},
		[history, historyIndex, submitForm],
	);

	return (
		<form
			onSubmit={submitForm}
			onClick={() => textareaRef.current?.focus()}
			className={classNames(
				'relative flex w-full flex-col rounded border border-gray-300 focus-within:outline-design-main focus:rounded focus:border-design-main focus:ring-design-main',
				{
					'bg-gray-300': disabled,
					'bg-gray-50': !disabled,
				},
			)}>
			<textarea
				ref={textareaRef}
				id="extendify-agent-chat-textarea"
				disabled={disabled}
				className={classNames(
					'flex max-h-[calc(75dvh)] min-h-10 w-full resize-none overflow-hidden bg-transparent px-2 pb-4 pt-2.5 text-base placeholder:text-gray-700 focus:shadow-none focus:outline-none disabled:opacity-50 md:text-sm',
				)}
				placeholder={
					block
						? __(
								'What do you want to change in the selected content?',
								'extendify-local',
							)
						: __('Ask anything', 'extendify-local')
				}
				rows="1"
				autoFocus
				value={input}
				onChange={(e) => {
					setInput(e.target.value);
					setHistoryIndex(null);
					adjustHeight();
				}}
				onKeyDown={handleKeyDown}
			/>
			<div className="flex justify-between gap-4 px-2 pb-2">
				{domTool ? <ChatTools disabled={disabled} /> : null}
				<div className="ms-auto flex items-center">
					<button
						type="submit"
						className="inline-flex h-fit items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 bg-design-main p-0.5 text-sm font-medium text-white transition-colors focus-visible:ring-design-main disabled:opacity-20"
						disabled={disabled || input.trim().length === 0}>
						<Icon fill="currentColor" icon={arrowUp} size={24} />
						<span className="sr-only">
							{__('Send message', 'extendify-local')}
						</span>
					</button>
				</div>
			</div>
		</form>
	);
};
