import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function TypewriterCinematic({
  text,
  holdMs = 4000,
  fadeMs = 1800,
  charMs = 42,
  long = false,
  onDone,
}) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const finishedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    finishedRef.current = false;
    setDisplayed('');
    setShowCursor(true);
    setFadeOut(false);

    let i = 0;
    let holdTimer;
    let doneTimer;
    const typeTimer = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typeTimer);
        setShowCursor(false);
        holdTimer = setTimeout(() => setFadeOut(true), holdMs);
        doneTimer = setTimeout(() => {
          if (finishedRef.current) return;
          finishedRef.current = true;
          onDoneRef.current?.();
        }, holdMs + fadeMs);
      }
    }, charMs);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [text, holdMs, fadeMs, charMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeMs / 1000, ease: 'easeInOut' }}
      className="h-full w-full flex items-center justify-center px-6 py-12"
    >
      <p
        className={`font-serif text-zinc-100 text-center leading-relaxed max-w-2xl ${
          long ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}
      >
        {displayed}
        {showCursor && <span className="animate-pulse">|</span>}
      </p>
    </motion.div>
  );
}
