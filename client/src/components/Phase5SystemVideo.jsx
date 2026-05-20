import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { waitingForPeer } from '../utils/names';

const VIDEO_SRC = '/0520.mp4';

function tryLockLandscape() {
  const o = screen.orientation;
  if (!o?.lock) return;
  o.lock('landscape').catch(() => {});
}

function unlockOrientation() {
  screen.orientation?.unlock?.();
}

export default function Phase5SystemVideo({ state, slot, emit }) {
  const videoRef = useRef(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [started, setStarted] = useState(false);
  const finishedRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[slot === 1 ? 2 : 1];

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setNeedsUnlock(false);
    tryLockLandscape();
    try {
      await video.play();
      setStarted(true);
    } catch {
      setNeedsUnlock(true);
      setStarted(false);
    }
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    setNeedsUnlock(false);
    setStarted(false);
    tryLockLandscape();
    const t = setTimeout(() => tryPlay(), 80);
    return () => {
      clearTimeout(t);
      unlockOrientation();
    };
  }, [tryPlay]);

  useEffect(() => {
    if (videoReady) finishedRef.current = true;
  }, [videoReady]);

  const handleEnded = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    emit('video-done');
  };

  const handleUnlock = async () => {
    await tryPlay();
  };

  if (videoReady && !peerReady) {
    return (
      <div className="portrait-video-stage z-[200] flex items-center justify-center px-6">
        <p className="text-lg text-zinc-500 text-center tracking-wide">
          {waitingForPeer(state, slot)}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="portrait-video-stage z-[200]"
    >
      <div className="portrait-video-frame-wrap">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="portrait-video-frame"
          playsInline
          preload="auto"
          onEnded={handleEnded}
          onPlay={() => setStarted(true)}
        ></video>
      </div>

      {needsUnlock && !started && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <button
            type="button"
            onClick={handleUnlock}
            className="px-8 py-4 font-mono text-sm md:text-base tracking-[0.25em] uppercase text-zinc-300 border border-zinc-600 rounded hover:border-white hover:text-white transition-colors duration-500"
          >
            [ INITIALIZE SYSTEM OVERRIDE ]
          </button>
        </div>
      )}
    </motion.div>
  );
}
