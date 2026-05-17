import { motion } from 'framer-motion';
import { BTN_CONTINUE } from '../styles';
import { waitingMessage } from '../utils/names';

export default function ContinueButton({ state, slot, ready, onContinue, label = '[ Mai departe ]' }) {
  const pressed = ready?.[slot];
  const otherReady = ready?.[slot === 1 ? 2 : 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 mt-8"
    >
      <button
        type="button"
        onClick={onContinue}
        disabled={pressed}
        className={BTN_CONTINUE}
      >
        {label}
      </button>
      {pressed && !otherReady && (
        <p className="text-lg text-zinc-400">{waitingMessage(state, slot)}</p>
      )}
    </motion.div>
  );
}
