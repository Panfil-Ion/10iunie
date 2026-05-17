import { useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LoadingSpinner from './LoadingSpinner';

export default function Phase1Handshake({ slot, state, peerTyping, emit }) {
  const [name, setName] = useState('');
  const submitted = state?.nameSubmitted?.[slot];
  const peerSubmitted = state?.nameSubmitted?.[slot === 1 ? 2 : 1];
  const peerName = peerTyping.name || state?.names?.[slot === 1 ? 2 : 1] || '';

  const handleChange = (e) => {
    setName(e.target.value);
    emit('name-typing', { value: e.target.value });
  };

  const handleSubmit = () => {
    if (!name.trim() || submitted) return;
    emit('name-submit');
  };

  if (state?.phase === 'PHASE_1_SYNC') {
    return (
      <FullScreenSync />
    );
  }

  return (
    <SplitScreen slot={slot} peerName={peerName}>
      {submitted ? (
        <LoadingSpinner text="Se așteaptă conexiunea..." />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-xs flex flex-col items-center gap-6"
        >
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Nume</p>
          <input
            type="text"
            value={name}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="..."
            autoComplete="off"
            className="w-full bg-transparent border-b border-zinc-800 text-center text-lg text-zinc-200 py-2 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
          />
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="mt-4 px-8 py-2 border border-zinc-800 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </motion.div>
      )}
    </SplitScreen>
  );
}

function FullScreenSync() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex items-center justify-center"
    >
      <p className="font-serif text-lg text-zinc-400 text-center italic animate-pulse">
        Sincronizare protocoale... Acces permis.
      </p>
    </motion.div>
  );
}
