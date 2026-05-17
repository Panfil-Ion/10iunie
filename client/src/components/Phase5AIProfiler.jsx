import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FullScreenText from './FullScreenText';

export default function Phase5AIProfiler({ slot, state, emit }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [displayText, setDisplayText] = useState('');
  const submitted = state?.game3?.submitted?.[slot];

  const badges = state?.badgeWords || [];

  if (state?.phase === 'PHASE_5_INTRO') {
    return (
      <FullScreenText>
        Adaptabilitate: Confirmată. Inițiere scanare psihologică cu Inteligență Artificială.
      </FullScreenText>
    );
  }

  useEffect(() => {
    if (state?.phase !== 'PHASE_5_RESULT' || !state?.game3?.aiText) return;

    const full = state.game3.aiText;
    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      i++;
      setDisplayText(full.slice(0, i));
      if (i >= full.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [state?.phase, state?.game3?.aiText]);

  if (state?.phase === 'PHASE_5_RESULT') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full w-full flex flex-col items-center justify-center px-8"
      >
        <div className="max-w-lg text-center">
          <p className="font-serif text-lg md:text-xl text-zinc-300 leading-relaxed italic min-h-[120px]">
            {displayText}
            <span className="animate-pulse">|</span>
          </p>
          {state.game3.generating && (
            <p className="text-xs text-zinc-600 mt-8">AI scanează personalitățile...</p>
          )}
        </div>
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
    const words = [...selected];
    if (custom.trim()) words.push(custom.trim());
    emit('game3-words', { words: selected, customWord: custom.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <motion.div className="flex-1 overflow-y-auto px-6 py-16">
        <p className="text-xs text-zinc-500 text-center mb-8 tracking-wide">
          Alege 3 cuvinte care te definesc
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {badges.map((word) => (
            <button
              key={word}
              onClick={() => toggleWord(word)}
              disabled={submitted}
              className={`px-3 py-1.5 text-xs border transition-all duration-300 ${
                selected.includes(word)
                  ? 'border-zinc-400 text-zinc-100 bg-zinc-900'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="shrink-0 px-6 pb-8 pt-4 border-t border-zinc-900">
        <p className="text-[10px] text-zinc-600 text-center mb-3">
          Nu te regăsești? Adaugă propriul cuvânt
        </p>
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          disabled={submitted}
          placeholder="..."
          className="w-full max-w-xs mx-auto block bg-transparent border-b border-zinc-800 text-center text-sm py-2 focus:outline-none focus:border-zinc-500 mb-4"
        />
        {submitted ? (
          <p className="text-center text-xs text-zinc-600">Se așteaptă peer-ul...</p>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selected.length < 3}
            className="block mx-auto px-8 py-2 border border-zinc-800 text-sm disabled:opacity-30 hover:border-zinc-600 transition-all duration-500"
          >
            Submit ({selected.length}/3)
          </button>
        )}
      </div>
    </motion.div>
  );
}
