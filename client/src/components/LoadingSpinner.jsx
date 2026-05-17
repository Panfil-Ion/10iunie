import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Se așteaptă conexiunea...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 px-4"
    >
      <motion.div
        className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-lg md:text-xl text-zinc-300 text-center leading-relaxed max-w-md">{text}</p>
    </motion.div>
  );
}
