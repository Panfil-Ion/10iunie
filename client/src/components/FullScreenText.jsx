import { motion } from 'framer-motion';

export default function FullScreenText({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className={`h-full w-full flex items-center justify-center px-8 ${className}`}
    >
      <p className="font-serif text-xl md:text-2xl text-zinc-300 text-center leading-relaxed max-w-lg italic">
        {children}
      </p>
    </motion.div>
  );
}
