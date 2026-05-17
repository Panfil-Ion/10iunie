import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Se așteaptă conexiunea...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        className="w-5 h-5 border border-zinc-600 border-t-zinc-300 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-xs text-zinc-500 tracking-wide">{text}</p>
    </motion.div>
  );
}
