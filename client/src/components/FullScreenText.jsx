import { motion } from 'framer-motion';

export default function FullScreenText({ children, className = '', long = false }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
      className={`h-full w-full flex items-center justify-center px-8 ${className}`}
    >
      <p
        className={`font-serif text-zinc-100 text-center leading-relaxed max-w-2xl italic ${
          long ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}
      >
        {children}
      </p>
    </motion.div>
  );
}
