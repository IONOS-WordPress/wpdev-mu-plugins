import { motion } from 'framer-motion';

export const PageSelectButtonPlaceholder = () => {
	return (
		<motion.div
			className={'rounded border border-gray-100'}
			animate={{ opacity: [0.9, 0.1, 0.9] }}
			transition={{
				duration: 3,
				repeat: Infinity,
				ease: 'easeInOut',
			}}>
			<div className="h-12 w-full grow overflow-hidden rounded bg-gray-100" />
		</motion.div>
	);
};
