import { motion } from 'framer-motion';
import { BTN_CONTINUE, BTN_RETRY } from '../styles';
import { waitingForPeer } from '../utils/names';

export default function GameLoopButtons({ state, slot, emit, game }) {
  const gameState = state?.[`game${game}`];
  const pressedNext = gameState?.loopNext?.[slot];
  const otherNext = gameState?.loopNext?.[slot === 1 ? 2 : 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 mt-8 w-full max-w-md"
    >
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button
          type="button"
          onClick={() => emit('game-loop-action', { game, action: 'retry' })}
          className={BTN_RETRY}
        >
          [ Mai încearcă ]
        </button>
        <button
          type="button"
          onClick={() => emit('game-loop-action', { game, action: 'next' })}
          disabled={pressedNext}
          className={BTN_CONTINUE}
        >
          [ Mai departe ]
        </button>
      </motion.div>
      {pressedNext && !otherNext && (
        <p className="text-lg text-zinc-400 text-center">{waitingForPeer(state, slot)}</p>
      )}
    </motion.div>
  );
}
