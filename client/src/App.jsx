import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import Phase1Handshake from './components/Phase1Handshake';
import Phase2Calibration from './components/Phase2Calibration';
import Phase3Sync from './components/Phase3Sync';
import Phase4PixelHunt from './components/Phase4PixelHunt';
import Phase5AIProfiler from './components/Phase5AIProfiler';
import Phase6Outro from './components/Phase6Outro';
import Phase5SystemVideo from './components/Phase5SystemVideo';
import VideoPreloader from './components/VideoPreloader';
import ScreenAck from './components/ScreenAck';
import TypewriterCinematic from './components/TypewriterCinematic';
import CalibrationLoading from './components/CalibrationLoading';
import RevengeToast from './components/RevengeToast';
import LoadingSpinner from './components/LoadingSpinner';
import { waitingForPeer, otherSlot } from './utils/names';

const CINEMATIC_SCREENS = {
  PHASE_1_SYNC: {
    text: 'Sincronizare protocoale... Acces permis.',
    holdMs: 4000,
    long: false,
  },
  PHASE_1_UNLOCK: {
    text: 'Sistem deblocat. Șansele ca doi oameni să aibă exact aceeași zi de naștere sunt de 0.27%. Universul a luat o decizie intenționată.',
    holdMs: 7000,
    long: true,
  },
};

const ACK_SCREENS = {
  PHASE_2_TRANSITION: {
    text: 'În continuare vor urma niște jocuri de calibrare pentru a testa compatibilitatea sistemelor.',
    long: true,
  },
  PHASE_3_RULES: {
    text: 'Jocul 1: Testul Timpului. Ține apăsat pe buton exact 10.00 secunde în mintea ta. Când crezi că au trecut 10 secunde, ia degetul.',
    long: true,
  },
  PHASE_4_RULES: {
    text: 'Jocul 2: Vânătoarea de Pixeli — Best of 3. Sistemul va cere 3 obiecte random. Cine face poza validată cel mai repede câștigă runda. Camera live, fără galerie.',
    long: true,
  },
  PHASE_5_VIDEO_PREP: {
    text: 'În continuare urmează un video. Pentru o experiență mai bună, conectează-ți căștile. Când ești gata, apasă mai jos.',
    long: false,
  },
};

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

function CinematicWait({ state, slot }) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <p className="text-lg text-zinc-500 text-center">{waitingForPeer(state, slot)}</p>
    </div>
  );
}

export default function App() {
  const { connected, slot, state, peerTyping, error, emit } = useSocket();
  const phase = state?.phase;
  const waiting = !state || phase === 'WAITING' || !slot;
  const isVideoPhase = phase === 'PHASE_5_VIDEO';
  const cinematic = CINEMATIC_SCREENS[phase];
  const ackScreen = ACK_SCREENS[phase];

  const emitCinematicDone = useCallback(() => {
    emit('cinematic-done');
  }, [emit]);

  const cinematicReady = state?.phaseData?.cinematicReady;
  const iFinishedCinematic = cinematicReady?.[slot];
  const peerFinishedCinematic = cinematicReady?.[otherSlot(slot)];

  let content = null;

  if (waiting) {
    content = <WaitingScreen connected={connected} error={error} />;
  } else if (phase === 'PHASE_2_LOADING') {
    content = iFinishedCinematic && !peerFinishedCinematic ? (
      <CinematicWait state={state} slot={slot} />
    ) : (
      <CalibrationLoading onDone={emitCinematicDone} />
    );
  } else if (cinematic) {
    content =
      iFinishedCinematic && !peerFinishedCinematic ? (
        <CinematicWait state={state} slot={slot} />
      ) : !iFinishedCinematic ? (
        <TypewriterCinematic
          text={cinematic.text}
          holdMs={cinematic.holdMs}
          long={cinematic.long}
          onDone={emitCinematicDone}
        />
      ) : (
        <CinematicWait state={state} slot={slot} />
      );
  } else if (ackScreen) {
    content = (
      <ScreenAck state={state} slot={slot} emit={emit} long={ackScreen.long}>
        {ackScreen.text}
      </ScreenAck>
    );
  } else if (isVideoPhase) {
    content = <Phase5SystemVideo state={state} slot={slot} emit={emit} />;
  } else {
    content = (
      <>
        {phase === 'PHASE_1' && (
          <Phase1Handshake slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
        )}
        {phase === 'PHASE_2' && (
          <Phase2Calibration slot={slot} state={state} peerTyping={peerTyping} emit={emit} />
        )}
        {(phase === 'PHASE_3' || phase === 'PHASE_3_RESULT') && (
          <Phase3Sync slot={slot} state={state} emit={emit} />
        )}
        {(phase === 'PHASE_4' ||
          phase === 'PHASE_4_ROUND_RESULT' ||
          phase === 'PHASE_4_GAME_RESULT') && (
          <Phase4PixelHunt slot={slot} state={state} emit={emit} />
        )}
        {(phase === 'PHASE_5' || phase === 'PHASE_5_RESULT') && (
          <Phase5AIProfiler slot={slot} state={state} emit={emit} />
        )}
        {phase === 'PHASE_6' && <Phase6Outro />}
      </>
    );
  }

  const preloadVideo = phase === 'PHASE_5_VIDEO_PREP' || phase === 'PHASE_5_VIDEO';

  return (
    <motion.div className="h-full w-full relative bg-zinc-950">
      <VideoPreloader active={preloadVideo} />
      {!isVideoPhase && <RevengeToast state={state} />}
      <Scoreboard state={state} />

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: isVideoPhase ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: isVideoPhase ? 1 : 0 }}
          transition={{ duration: isVideoPhase ? 0 : 0.4 }}
          className="h-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
