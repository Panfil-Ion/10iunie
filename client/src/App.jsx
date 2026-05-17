import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import Phase1Handshake from './components/Phase1Handshake';
import Phase2Calibration from './components/Phase2Calibration';
import Phase3Sync from './components/Phase3Sync';
import Phase4PixelHunt from './components/Phase4PixelHunt';
import Phase5AIProfiler from './components/Phase5AIProfiler';
import Phase6Outro from './components/Phase6Outro';
import FullScreenText from './components/FullScreenText';
import LoadingSpinner from './components/LoadingSpinner';

const TRANSITION_PHASES = {
  PHASE_1_SYNC: 'Sincronizare protocoale... Acces permis.',
  PHASE_1_UNLOCK:
    'Sistem deblocat. Șansele ca doi oameni să aibă exact aceeași zi de naștere sunt de 0.27%. Universul a luat o decizie intenționată.',
  PHASE_2_TRANSITION:
    'În continuare vor urma niște jocuri de calibrare pentru a testa compatibilitatea sistemelor.',
  PHASE_3_RULES:
    'Jocul 1: Testul Timpului. Ține apăsat pe buton exact 10.00 secunde în mintea ta. Când crezi că au trecut 10 secunde, ia degetul.',
  PHASE_4_RULES:
    'Jocul 2: Vânătoarea de Pixeli. Sistemul va cere un obiect random. Cine deschide camera și face poza cel mai repede, câștigă.',
};

const LONG_TEXT_PHASES = ['PHASE_1_UNLOCK', 'PHASE_2_TRANSITION', 'PHASE_4_RULES'];

function WaitingScreen({ connected, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center gap-8"
    >
      {error ? (
        <p className="text-xl text-red-400 px-8 text-center">{error}</p>
      ) : (
        <>
          <LoadingSpinner
            text={connected ? 'Se așteaptă al doilea jucător în cameră...' : 'Conectare la server...'}
          />
          <p className="text-sm text-zinc-600 tracking-[0.35em] uppercase">10 June Sync Protocol</p>
        </>
      )}
    </motion.div>
  );
}

export default function App() {
  const { connected, slot, state, peerTyping, error, emit } = useSocket();
  const phase = state?.phase;
  const waiting = !state || phase === 'WAITING' || !slot;
  const transitionText = TRANSITION_PHASES[phase];

  return (
    <div className="h-full w-full relative bg-zinc-950">
      <Scoreboard state={state} />

      <AnimatePresence mode="wait">
        {waiting ? (
          <WaitingScreen key="wait" connected={connected} error={error} />
        ) : transitionText ? (
          <motion.div key={phase} className="h-full" exit={{ opacity: 0 }} transition={{ duration: 1.5 }}>
            <FullScreenText long={LONG_TEXT_PHASES.includes(phase)}>{transitionText}</FullScreenText>
          </motion.div>
        ) : (
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-full"
          >
            {phase === 'PHASE_1' && (
              <Phase1Handshake slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
            )}
            {phase === 'PHASE_2' && (
              <Phase2Calibration slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
            )}
            {(phase === 'PHASE_3' || phase === 'PHASE_3_RESULT') && (
              <Phase3Sync slot={slot} state={state} emit={emit} />
            )}
            {(phase === 'PHASE_4' || phase === 'PHASE_4_RESULT') && (
              <Phase4PixelHunt slot={slot} state={state} emit={emit} />
            )}
            {(phase === 'PHASE_5' || phase === 'PHASE_5_RESULT') && (
              <Phase5AIProfiler slot={slot} state={state} emit={emit} />
            )}
            {phase === 'PHASE_6' && <Phase6Outro />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
