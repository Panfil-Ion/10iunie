import { motion } from 'framer-motion';
import { BTN_ACK } from '../styles';
import { waitingForPeer, otherSlot } from '../utils/names';

export default function ScreenAck({ state, slot, emit, children, long = false, subtext }) {
  const acked = state?.phaseData?.ackReady?.[slot];
  const otherAcked = state?.phaseData?.ackReady?.[otherSlot(slot)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
    >
      <p
        className={`font-serif text-zinc-100 text-center leading-relaxed max-w-2xl ${
          subtext ? 'mb-6' : 'mb-10'
        } ${long ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}
      >
        {children}
      </p>

      {subtext && (
        <p className="font-serif text-zinc-400 text-center leading-relaxed max-w-2xl text-lg md:text-xl mb-10 mt-2">
          {subtext}
        </p>
      )}

      <button
        type="button"
        onClick={() => emit('screen-ack')}
        disabled={acked}
        className={BTN_ACK}
      >
        Am înțeles / Începe
      </button>

      {acked && !otherAcked && (
        <p className="mt-8 text-lg text-zinc-400 text-center">{waitingForPeer(state, slot)}</p>
      )}
    </motion.div>
  );
}
