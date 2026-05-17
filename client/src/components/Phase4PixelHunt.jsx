import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import FullScreenText from './FullScreenText';
import LoadingSpinner from './LoadingSpinner';

export default function Phase4PixelHunt({ slot, state, emit }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (state?.phase === 'PHASE_4_INTRO') {
    return (
      <FullScreenText>
        Timpul este relativ, dar reacțiile sunt reale. Pregătiți camerele.
      </FullScreenText>
    );
  }

  if (state?.phase === 'PHASE_4_RESULT') {
    const myTime = state.game2.uploadTimes[slot];
    const peerTime = state.game2.uploadTimes[slot === 1 ? 2 : 1];
    const myResult = state.game2.visionResults[slot];
    const peerResult = state.game2.visionResults[slot === 1 ? 2 : 1];
    const winner = state.game2.winner;

    return (
      <SplitScreen slot={slot} unified>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center px-6 space-y-3"
        >
          <p className="text-sm text-zinc-400">
            Tu: {myResult} ({(myTime / 1000).toFixed(2)}s) — Peer: {peerResult} (
            {(peerTime / 1000).toFixed(2)}s)
          </p>
          <p className="font-serif text-lg text-zinc-300 italic">
            {winner === slot ? '+1 punct (mai rapid + validat)' : winner ? 'Peer-ul a câștigat runda.' : 'Nimeni nu a câștigat.'}
          </p>
        </motion.div>
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
      const base64 = reader.result;
      setPreview(base64);
      setUploading(true);
      emit('game2-photo', { base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <SplitScreen slot={slot}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center px-4 max-w-sm"
      >
        <p className="text-xs text-zinc-500 leading-relaxed">
          Sistemul cere validare fizică. Aveți 30 de secunde să fotografiați:{' '}
          <span className="text-zinc-300">{object}</span>.
        </p>

        {submitted || uploading ? (
          <LoadingSpinner
            text={processing ? 'AI validează imaginile...' : 'Imagine trimisă. Se așteaptă peer-ul...'}
          />
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-8 py-3 border border-zinc-800 text-sm text-zinc-300 hover:border-zinc-600 transition-all duration-500"
            >
              Deschide Camera
            </button>
          </>
        )}

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-20 h-20 object-cover rounded opacity-50 border border-zinc-800"
          />
        )}
      </motion.div>
    </SplitScreen>
  );
}
