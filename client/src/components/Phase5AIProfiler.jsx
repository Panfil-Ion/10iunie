import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContinueButton from './ContinueButton';
import { INPUT_CLASS, BTN_SUBMIT } from '../styles';
import { waitingMessage } from '../utils/names';

export default function Phase5AIProfiler({ slot, state, emit }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const submitted = state?.game3?.submitted?.[slot];

  const badges = state?.badgeWords || [];

  useEffect(() => {
    if (state?.phase !== 'PHASE_5_RESULT' || !state?.game3?.aiText) return;

    const full = state.game3.aiText;
    let i = 0;
    setDisplayText('');
    setTypewriterDone(false);

    const interval = setInterval(() => {
      i++;
      setDisplayText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(interval);
        setTypewriterDone(true);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [state?.phase, state?.game3?.aiText]);

  if (state?.phase === 'PHASE_5_RESULT') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full w-full flex flex-col items-center justify-center px-6 py-20 overflow-y-auto"
      >
        <motion.div className="max-w-2xl text-center flex-1 flex flex-col justify-center">
          <p className="font-serif text-2xl md:text-3xl text-zinc-100 leading-relaxed italic min-h-[100px]">
            {displayText}
            {!typewriterDone && <span className="animate-pulse">|</span>}
          </p>
          {state.game3.generating && (
            <p className="text-lg text-zinc-500 mt-8">AI scanează personalitățile...</p>
          )}
        </motion.div>

        {typewriterDone && !state.game3.generating && (
          <ContinueButton
            state={state}
            slot={slot}
            ready={state.game3.continueReady}
            onContinue={() => emit('phase-continue')}
            label="[ Mergi spre Final ]"
          />
        )}
      </motion.div>
    );
  }

  const toggleWord = (word) => {
    if (submitted) return;
    setSelected((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 3) return prev;
      return [...prev, word];
    });
  };

  const handleSubmit = () => {
    if (submitted || selected.length < 3) return;
    emit('game3-words', { words: selected, customWord: custom.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <motion.div className="flex-1 overflow-y-auto px-4 py-16">
        <p className="text-xl md:text-2xl text-zinc-300 text-center mb-10">
          Alege 3 cuvinte care te definesc
        </p>
        <motion.div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {badges.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => toggleWord(word)}
              disabled={submitted}
              className={`px-5 py-3 text-lg border-2 rounded-xl transition-all duration-300 ${
                selected.includes(word)
                  ? 'border-white text-white bg-zinc-800'
                  : 'border-zinc-600 text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {word}
            </button>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className="shrink-0 px-4 pb-10 pt-6 border-t border-zinc-800">
        <p className="text-lg text-zinc-500 text-center mb-4">
          Nu te regăsești? Adaugă propriul cuvânt
        </p>
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          disabled={submitted}
          placeholder="Cuvântul tău"
          className={`${INPUT_CLASS} max-w-md mx-auto block mb-6`}
        />
        {submitted ? (
          <p className="text-lg text-zinc-400 text-center">{waitingMessage(state, slot)}</p>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length < 3}
            className={`${BTN_SUBMIT} block mx-auto`}
          >
            Submit ({selected.length}/3)
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
