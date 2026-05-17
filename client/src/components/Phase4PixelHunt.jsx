import { useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LoadingSpinner from './LoadingSpinner';
import { BTN_SUBMIT } from '../styles';
import { getName, waitingMessage } from '../utils/names';

export default function Phase4PixelHunt({ slot, state, emit }) {
  const [uploading, setUploading] = useState(false);

  const n1 = getName(state, 1);
  const n2 = getName(state, 2);

  if (state?.phase === 'PHASE_4_RESULT') {
    const winner = state.game2.winner;
    const winnerName = winner ? getName(state, winner) : null;
    const t1 = (state.game2.uploadTimes[1] / 1000).toFixed(2);
    const t2 = (state.game2.uploadTimes[2] / 1000).toFixed(2);

    let line = `${n1}: ${state.game2.visionResults[1]} (${t1}s) — ${n2}: ${state.game2.visionResults[2]} (${t2}s).`;
    if (winnerName) line += ` Punct pentru ${winnerName}.`;

    return (
      <SplitScreen slot={slot} unified>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl md:text-2xl text-zinc-200 text-center px-6 leading-relaxed"
        >
          {line}
        </motion.p>
      </SplitScreen>
    );
  }

  const object = state?.game2?.object;
  const submitted = state?.game2?.submitted?.[slot];
  const processing = state?.game2?.processing;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || submitted) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploading(true);
      emit('game2-photo', { base64: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <SplitScreen slot={slot}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8 text-center px-4 max-w-lg"
      >
        <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed">
          Fotografiază: <span className="text-white font-medium">{object}</span>
        </p>

        {submitted || uploading ? (
          <LoadingSpinner
            text={
              processing
                ? 'AI validează imaginile...'
                : waitingMessage(state, slot)
            }
          />
        ) : (
          <label className={`${BTN_SUBMIT} cursor-pointer relative inline-flex items-center justify-center min-w-[220px]`}>
            <span className="pointer-events-none">Deschide Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Deschide camera"
            />
          </label>
        )}
      </motion.div>
    </SplitScreen>
  );
}
