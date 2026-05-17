import { useRef } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
export default function Phase3Sync({ slot, state, emit }) {
  const pressing = useRef(false);

  if (state?.phase === 'PHASE_3_RESULT') {
    const d1 = state.game1.durations[1];
    const d2 = state.game1.durations[2];
    const winner = state.game1.winner;
    const myDur = state.game1.durations[slot];
    const peerDur = state.game1.durations[slot === 1 ? 2 : 1];

    return (
      <SplitScreen slot={slot} unified>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center px-6"
        >
          <p className="text-sm text-zinc-400">
            Tu: <span className="text-zinc-200">{myDur}s</span> — Peer:{' '}
            <span className="text-zinc-200">{peerDur}s</span>
          </p>
          <p className="font-serif text-lg text-zinc-300 italic">
            {winner === slot
              ? 'Cel mai apropiat de 10.00s. +1 punct.'
              : winner
                ? 'Peer-ul a fost mai aproape de 10.00s.'
                : 'Egalitate perfectă (sau aproape).'}
          </p>
        </motion.div>
      </SplitScreen>
    );
  }

  const submitted = state?.game1?.submitted?.[slot];

  const onDown = (e) => {
    e.preventDefault();
    if (submitted || pressing.current) return;
    pressing.current = true;
    emit('game1-down');
  };

  const onUp = (e) => {
    e.preventDefault();
    if (!pressing.current || submitted) return;
    pressing.current = false;
    emit('game1-up');
  };

  return (
    <SplitScreen slot={slot}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8 text-center px-4"
      >
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Ține apăsat exact 10.00 secunde în mintea ta. Ia degetul când timpul expiră.
        </p>
        {submitted ? (
          <p className="text-zinc-600 text-sm">Măsurare înregistrată...</p>
        ) : (
          <motion.button
            className="w-24 h-24 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs select-none touch-none"
            whileTap={{ scale: 0.95, borderColor: 'rgb(161 161 170)' }}
            onMouseDown={onDown}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchEnd={onUp}
          >
            HOLD
          </motion.button>
        )}
      </motion.div>
    </SplitScreen>
  );
}
