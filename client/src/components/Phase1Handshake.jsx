import { useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LoadingSpinner from './LoadingSpinner';
import { INPUT_CLASS, BTN_SUBMIT } from '../styles';
import { waitingForPeer } from '../utils/names';

export default function Phase1Handshake({ slot, state, peerTyping, emit }) {
  const [name, setName] = useState(state?.names?.[slot] || '');
  const submitted = state?.nameSubmitted?.[slot];
  const peerName = peerTyping.name || state?.names?.[slot === 1 ? 2 : 1] || '';

  const handleChange = (e) => {
    setName(e.target.value);
    emit('name-typing', { value: e.target.value });
  };

  const handleSubmit = () => {
    if (!name.trim() || submitted) return;
    emit('name-submit', { value: name.trim() });
  };

  return (
    <SplitScreen slot={slot} peerName={peerName}>
      {submitted ? (
        <LoadingSpinner text={waitingForPeer(state, slot)} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md flex flex-col items-center gap-4 px-4"
        >
          <p className="text-xl text-zinc-300 tracking-wide">Nume</p>
          <input
            type="text"
            value={name}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Introdu numele tău"
            autoComplete="off"
            className={INPUT_CLASS}
          />
          <button type="button" onClick={handleSubmit} disabled={!name.trim()} className={BTN_SUBMIT}>
            Submit
          </button>
        </motion.div>
      )}
    </SplitScreen>
  );
}
