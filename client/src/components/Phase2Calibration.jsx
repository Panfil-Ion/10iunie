import { useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LoadingSpinner from './LoadingSpinner';
import FullScreenText from './FullScreenText';

export default function Phase2Calibration({ slot, state, peerTyping, emit }) {
  const [date, setDate] = useState('');
  const submitted = state?.dateSubmitted?.[slot];
  const peerDate = peerTyping.date || state?.dates?.[slot === 1 ? 2 : 1] || '';

  if (state?.phase === 'PHASE_2_UNLOCK') {
    return (
      <FullScreenText>
        Sistem deblocat. Șansele ca doi oameni să aibă exact aceeași zi de naștere sunt de 0.27%.
        Universul a luat o decizie intenționată.
      </FullScreenText>
    );
  }

  const handleChange = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '');
    if (v.length > 5) v = v.slice(0, 5);
    setDate(v);
    emit('date-typing', { value: v });
  };

  const handleSubmit = () => {
    if (submitted) return;
    emit('date-submit');
  };

  return (
    <SplitScreen slot={slot} peerDate={peerDate}>
      {submitted ? (
        <LoadingSpinner text="Se așteaptă conexiunea..." />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
        >
          <p className="text-xs text-zinc-500 tracking-wide leading-relaxed max-w-xs">
            Introduceți data de calibrare a sistemului.
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={date}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="DD.MM"
            className="w-full bg-transparent border-b border-zinc-800 text-center text-2xl text-zinc-200 py-2 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700 tracking-widest"
          />
          <button
            onClick={handleSubmit}
            className="mt-4 px-8 py-2 border border-zinc-800 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-all duration-500"
          >
            Submit
          </button>
        </motion.div>
      )}
    </SplitScreen>
  );
}
