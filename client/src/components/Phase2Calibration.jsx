import { useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LoadingSpinner from './LoadingSpinner';
import { INPUT_CLASS, BTN_SUBMIT } from '../styles';
import { waitingMessage } from '../utils/names';

export default function Phase2Calibration({ slot, state, peerTyping, emit }) {
  const [date, setDate] = useState('');
  const submitted = state?.dateSubmitted?.[slot];
  const peerDate = peerTyping.date || state?.dates?.[slot === 1 ? 2 : 1] || '';

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
        <LoadingSpinner text={waitingMessage(state, slot)} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md flex flex-col items-center gap-4 px-4 text-center"
        >
          <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed">
            Introduceți data de calibrare a sistemului.
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={date}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="DD.MM"
            className={INPUT_CLASS}
          />
          <button type="button" onClick={handleSubmit} className={BTN_SUBMIT}>
            Submit
          </button>
        </motion.div>
      )}
    </SplitScreen>
  );
}
