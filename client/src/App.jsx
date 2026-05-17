import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import Phase1Handshake from './components/Phase1Handshake';
import Phase2Calibration from './components/Phase2Calibration';
import Phase3Sync from './components/Phase3Sync';
import Phase4PixelHunt from './components/Phase4PixelHunt';
import Phase5AIProfiler from './components/Phase5AIProfiler';
import Phase6Outro from './components/Phase6Outro';
import LoadingSpinner from './components/LoadingSpinner';

function WaitingScreen({ connected, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center gap-6"
    >
      {error ? (
        <p className="text-sm text-red-400/80 px-8 text-center">{error}</p>
      ) : (
        <>
          <LoadingSpinner text={connected ? 'Se așteaptă al doilea jucător...' : 'Conectare la server...'} />
          <p className="text-[10px] text-zinc-700 tracking-[0.4em] uppercase mt-8">
            10 June Sync Protocol
          </p>
        </>
      )}
    </motion.div>
  );
}

export default function App() {
  const { connected, slot, state, peerTyping, error, emit } = useSocket();

  const phase = state?.phase;
  const waiting = !state || phase === 'WAITING' || !slot;

  const isFullscreen =
    phase === 'PHASE_2_UNLOCK' ||
    phase === 'PHASE_4_INTRO' ||
    phase === 'PHASE_5_INTRO' ||
    phase === 'PHASE_5' ||
    phase === 'PHASE_5_RESULT' ||
    phase === 'PHASE_6' ||
    phase === 'PHASE_6_END' ||
    phase === 'PHASE_1_SYNC';

  return (
    <div className="h-full w-full relative bg-zinc-950">
      <Scoreboard state={state} />

      <AnimatePresence mode="wait">
        {waiting ? (
          <WaitingScreen key="wait" connected={connected} error={error} />
        ) : (
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`h-full ${isFullscreen ? '' : ''}`}
          >
            {(phase === 'PHASE_1' || phase === 'PHASE_1_SYNC') && (
              <Phase1Handshake slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
            )}
            {(phase === 'PHASE_2' || phase === 'PHASE_2_UNLOCK') && (
              <Phase2Calibration slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
            )}
            {(phase === 'PHASE_3' || phase === 'PHASE_3_RESULT') && (
              <Phase3Sync slot={slot} state={state} emit={emit} />
            )}
            {(phase === 'PHASE_4_INTRO' ||
              phase === 'PHASE_4' ||
              phase === 'PHASE_4_RESULT') && (
              <Phase4PixelHunt slot={slot} state={state} emit={emit} />
            )}
            {(phase === 'PHASE_5_INTRO' ||
              phase === 'PHASE_5' ||
              phase === 'PHASE_5_RESULT') && (
              <Phase5AIProfiler slot={slot} state={state} emit={emit} />
            )}
            {phase === 'PHASE_6' && <Phase6Outro state={state} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
