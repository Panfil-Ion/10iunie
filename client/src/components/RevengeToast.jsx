import { AnimatePresence, motion } from 'framer-motion';

export default function RevengeToast({ state }) {
  const revenge = state?.phaseData?.revengeAlert;
  if (!revenge) return null;

  return (
    <AnimatePresence>
      <motion.p
        key="revenge"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed top-20 left-0 right-0 z-[100] text-center text-xl text-amber-300 font-bold px-4 pointer-events-none"
      >
        {revenge.name} vrea revanșa!
      </motion.p>
    </AnimatePresence>
  );
}
