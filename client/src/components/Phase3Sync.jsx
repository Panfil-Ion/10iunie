import { useRef } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import GameLoopButtons from './GameLoopButtons';
import LoadingSpinner from './LoadingSpinner';
import { BTN_HOLD } from '../styles';
import { getName, otherSlot, waitingForPeer } from '../utils/names';

export default function Phase3Sync({ slot, state, emit }) {
  const pressing = useRef(false);
  const n1 = getName(state, 1);
  const n2 = getName(state, 2);

  if (state?.phase === 'PHASE_3_RESULT') {
    const winner = state.game1.winner;
    const winnerName = winner ? getName(state, winner) : null;
    let resultLine = `${n1} a ținut ${state.game1.durations[1]}s, ${n2} a ținut ${state.game1.durations[2]}s.`;
    if (winnerName) resultLine += ` Punct pentru ${winnerName}.`;
    else resultLine += ' Egalitate.';

    return (
      <SplitScreen slot={slot} unified>
        <motion.div className="flex flex-col items-center text-center px-6 max-w-xl">
          <p className="text-xl md:text-2xl text-zinc-100 leading-relaxed mb-4">{resultLine}</p>
          <GameLoopButtons state={state} slot={slot} emit={emit} game={1} />
        </motion.div>
      </SplitScreen>
    );
  }

  const submitted = state?.game1?.submitted?.[slot];
  const otherSubmitted = state?.game1?.submitted?.[otherSlot(slot)];

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
      <motion.div className="flex flex-col items-center gap-8 text-center px-4">
        {submitted ? (
          <LoadingSpinner
            text={otherSubmitted ? 'Se calculează rezultatele...' : waitingForPeer(state, slot)}
          />
        ) : (
          <motion.button
            type="button"
            className={BTN_HOLD}
            whileTap={{ scale: 0.95, borderColor: '#fff' }}
            onMouseDown={onDown}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchEnd={onUp}
          >
            ȚINE
          </motion.button>
        )}
      </motion.div>
    </SplitScreen>
  );
}
