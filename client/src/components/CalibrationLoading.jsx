import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'loading', ms: 2500 },
  { label: 'restructurare', ms: 2500 },
  { label: 'analizare', ms: 2500 },
  { label: 'verified', ms: 2500 },
];

export default function CalibrationLoading({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showDone, setShowDone] = useState(false);
  const finishedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    finishedRef.current = false;
    setStepIndex(0);
    setShowDone(false);

    let elapsed = 0;
    const timers = [];

    STEPS.forEach((step, idx) => {
      timers.push(setTimeout(() => setStepIndex(idx), elapsed));
      elapsed += step.ms;
    });

    timers.push(setTimeout(() => setShowDone(true), elapsed));

    timers.push(
      setTimeout(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onDoneRef.current?.();
      }, elapsed + 1200)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {!showDone ? (
          <motion.p
            key={STEPS[stepIndex].label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="font-mono text-2xl md:text-3xl text-zinc-300 tracking-widest uppercase"
          >
            {STEPS[stepIndex].label}
          </motion.p>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center">
              <span className="text-4xl text-emerald-400">✓</span>
            </div>
            <p className="text-xl text-emerald-400 font-medium tracking-wide">done</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
