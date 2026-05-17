import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FUGES_BEFORE_TEXT1 = 4;
const FUGES_BEFORE_TEXT2 = 3;
const FUGES_BEFORE_TEXT3 = 3;

export default function Phase6Outro() {
  const [phase, setPhase] = useState('intro');
  const [buttonText, setButtonText] = useState('Închide Conexiunea');
  const [fleeCount, setFleeCount] = useState(0);
  const [fixed, setFixed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);
  const containerRef = useRef(null);

  const flee = useCallback(() => {
    if (fixed || phase !== 'button') return;

    const container = containerRef.current?.getBoundingClientRect();
    const btn = btnRef.current?.getBoundingClientRect();
    if (!container || !btn) return;

    const maxX = Math.max(container.width - btn.width - 80, 0);
    const maxY = Math.max(container.height - btn.height - 80, 0);
    const newX = (Math.random() - 0.5) * maxX;
    const newY = (Math.random() - 0.5) * maxY;

    setPos({ x: newX, y: newY });

    const next = fleeCount + 1;
    setFleeCount(next);

    if (next === FUGES_BEFORE_TEXT1) {
      setButtonText('Bine, bine. Lasă-mă să plec.');
    } else if (next === FUGES_BEFORE_TEXT1 + FUGES_BEFORE_TEXT2) {
      setButtonText('Promit că nu mai fug. Apasă aici.');
    } else if (next === FUGES_BEFORE_TEXT1 + FUGES_BEFORE_TEXT2 + FUGES_BEFORE_TEXT3) {
      setFixed(true);
      setPos({ x: 0, y: 0 });
    }
  }, [fleeCount, fixed, phase]);

  const handleFinalClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fixed) return;
    setPhase('ended');
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('button');
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center">
        <p className="text-base md:text-lg text-zinc-500 text-center px-8 leading-relaxed max-w-md">
          Eroare: Zâmbetul tău a blocat serverul. Ne vedem în realitate.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="h-full w-full relative bg-zinc-950"
      animate={{ backgroundColor: '#09090b' }}
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center px-8"
          >
            <p className="font-serif text-2xl md:text-3xl text-zinc-100 text-center italic leading-relaxed">
              Testare completă. La mulți ani nouă. Ai grijă de tine.
            </p>
          </motion.div>
        )}

        {phase === 'button' && (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <motion.button
              ref={btnRef}
              type="button"
              animate={{ x: pos.x, y: pos.y }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onMouseEnter={!fixed ? flee : undefined}
              onTouchStart={
                !fixed
                  ? (e) => {
                      e.preventDefault();
                      flee();
                    }
                  : undefined
              }
              onPointerDown={fixed ? handleFinalClick : undefined}
              onClick={fixed ? handleFinalClick : undefined}
              className={`relative z-10 px-8 py-4 bg-white text-zinc-950 text-lg md:text-xl font-medium rounded-sm ${
                fixed ? 'cursor-pointer' : ''
              }`}
            >
              {buttonText}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
