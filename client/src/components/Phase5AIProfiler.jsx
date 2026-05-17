import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLoopButtons from './GameLoopButtons';
import ThinkingBlink from './ThinkingBlink';
import { INPUT_CLASS, BTN_SUBMIT } from '../styles';
import { waitingForPeer } from '../utils/names';

const THINKING_MS = 4000;
const GENERATING_MS = 4000;

export default function Phase5AIProfiler({ slot, state, emit }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [loaderStep, setLoaderStep] = useState('thinking');
  const [generatingMinDone, setGeneratingMinDone] = useState(false);
  const sequenceRef = useRef(false);

  const submitted = state?.game3?.submitted?.[slot];
  const generating = state?.game3?.generating;
  const bothSubmitted = state?.game3?.submitted?.[1] && state?.game3?.submitted?.[2];
  const badges = state?.phaseData?.badgeWords || [];
  const aiText = state?.game3?.aiText;

  useEffect(() => {
    if (state?.phase !== 'PHASE_5_RESULT') {
      sequenceRef.current = false;
      setLoaderStep('thinking');
      setGeneratingMinDone(false);
      setDisplayText('');
      setTypewriterDone(false);
      return;
    }

    if (sequenceRef.current) return;
    sequenceRef.current = true;
    setLoaderStep('thinking');
    setGeneratingMinDone(false);
    setDisplayText('');
    setTypewriterDone(false);

    const timers = [];
    timers.push(
      setTimeout(() => {
        setLoaderStep('generating');
        timers.push(setTimeout(() => setGeneratingMinDone(true), GENERATING_MS));
      }, THINKING_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [state?.phase]);

  useEffect(() => {
    if (state?.phase !== 'PHASE_5_RESULT') return;
    if (loaderStep !== 'generating' || !generatingMinDone || !aiText) return;
    setLoaderStep('story');
  }, [state?.phase, loaderStep, generatingMinDone, aiText]);

  useEffect(() => {
    if (state?.phase !== 'PHASE_5_RESULT' || loaderStep !== 'story' || !aiText) return;

    const full = aiText;
    let i = 0;
    setDisplayText('');
    setTypewriterDone(false);

    const interval = setInterval(() => {
      i += 1;
      setDisplayText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(interval);
        setTypewriterDone(true);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [state?.phase, loaderStep, aiText]);

  if (state?.phase === 'PHASE_5_RESULT') {
    if (loaderStep === 'thinking') {
      return <ThinkingBlink label="thinking" />;
    }

    if (loaderStep === 'generating') {
      return <ThinkingBlink label="generare poveste" />;
    }

    return (
      <motion.div className="h-full w-full flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
        <div className="w-full max-w-2xl flex-1 flex flex-col justify-center min-h-0">
          <div className="max-h-96 overflow-y-auto p-4 text-left">
            <p className="font-serif text-xl md:text-2xl text-zinc-100 leading-relaxed">
              {displayText}
              {!typewriterDone && <span className="animate-pulse">|</span>}
            </p>
          </div>
        </div>

        {typewriterDone && (
          <GameLoopButtons state={state} slot={slot} emit={emit} game={3} />
        )}
      </motion.div>
    );
  }

  if (generating || (bothSubmitted && submitted)) {
    return <ThinkingBlink label="thinking" />;
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
      <div className="flex-1 overflow-y-auto px-4 py-16">
        <p className="text-xl md:text-2xl text-zinc-300 text-center mb-10">
          Alege 3 cuvinte care te definesc
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
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
        </div>
      </div>

      <div className="shrink-0 px-4 pb-10 pt-6 border-t border-zinc-800">
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
          <p className="text-lg text-zinc-400 text-center">{waitingForPeer(state, slot)}</p>
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
      </div>
    </motion.div>
  );
}
