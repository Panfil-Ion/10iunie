import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FUGES_BEFORE_TEXT1 = 4;
const FUGES_BEFORE_TEXT2 = 3;
const FUGES_BEFORE_TEXT3 = 3;

export default function Phase6Outro({ state }) {
  const [phase, setPhase] = useState('intro'); // intro | fade | button | ended
  const [showIntro, setShowIntro] = useState(true);
  const [buttonText, setButtonText] = useState('[ Închide Conexiunea ]');
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

    const maxX = container.width - btn.width - 40;
    const maxY = container.height - btn.height - 40;
    const newX = Math.random() * Math.max(maxX, 0) - maxX / 2;
    const newY = Math.random() * Math.max(maxY, 0) - maxY / 2;

    setPos({ x: newX, y: newY });

    const next = fleeCount + 1;
    setFleeCount(next);

    if (next === FUGES_BEFORE_TEXT1) {
      setButtonText('[ Bine, bine. Lasă-mă să plec. ]');
    } else if (next === FUGES_BEFORE_TEXT1 + FUGES_BEFORE_TEXT2) {
      setButtonText('[ Promit că nu mai fug. Apasă aici. ]');
    } else if (next === FUGES_BEFORE_TEXT1 + FUGES_BEFORE_TEXT2 + FUGES_BEFORE_TEXT3) {
      setFixed(true);
      setPos({ x: 0, y: 0 });
    }
  }, [fleeCount, fixed, phase]);

  const handleClick = () => {
    if (!fixed) return;
    setPhase('ended');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      document.documentElement.style.pointerEvents = 'none';
    }, 3000);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setShowIntro(false), 4000);
    const t2 = setTimeout(() => setPhase('button'), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full relative bg-zinc-950">
      <AnimatePresence mode="wait">
        {phase === 'intro' && showIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center px-8"
          >
            <motion.p
              animate={{ opacity: showIntro ? 1 : 0 }}
              transition={{ duration: 1 }}
              className="font-serif text-xl md:text-2xl text-zinc-300 text-center italic leading-relaxed"
            >
              Testare completă. La mulți ani nouă. Ai grijă de tine.
            </motion.p>
          </motion.div>
        )}

        {phase === 'button' && (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.button
              ref={btnRef}
              layout={!fixed}
              animate={{ x: pos.x, y: pos.y }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onMouseEnter={!fixed ? flee : undefined}
              onTouchStart={!fixed ? (e) => { e.preventDefault(); flee(); } : undefined}
              onClick={handleClick}
              className={`px-6 py-3 bg-white text-zinc-950 text-sm font-medium ${
                fixed ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={fixed ? { position: 'relative' } : {}}
            >
              {buttonText}
            </motion.button>
          </motion.div>
        )}

        {phase === 'ended' && <EndedScreen key="ended" />}
      </AnimatePresence>
    </div>
  );
}

function EndedScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
      className="absolute inset-0 flex items-center justify-center bg-zinc-950"
    >
      <p className="text-[11px] text-zinc-600 text-center px-8 leading-relaxed">
        Eroare: Zâmbetul tău a blocat serverul. Ne vedem în realitate.
      </p>
    </motion.div>
  );
}
