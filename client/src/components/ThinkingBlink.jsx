import { motion } from 'framer-motion';

export default function ThinkingBlink({ label = 'thinking' }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <motion.p
        className="font-mono text-3xl md:text-4xl text-zinc-300 tracking-[0.2em] lowercase"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </div>
  );
}
