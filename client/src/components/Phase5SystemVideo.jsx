import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { waitingForPeer } from '../utils/names';

const VIDEO_SRC = '/0520.mp4';
const SYNC_TOLERANCE_S = 0.35;

function waitCanPlayThrough(video) {
  return new Promise((resolve) => {
    if (video.readyState >= 4) {
      resolve();
      return;
    }
    const onReady = () => {
      video.removeEventListener('canplaythrough', onReady);
      resolve();
    };
    video.addEventListener('canplaythrough', onReady);
    video.load();
  });
}

function waitUntil(timestamp) {
  const ms = timestamp - Date.now();
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

export default function Phase5SystemVideo({ state, slot, emit }) {
  const videoRef = useRef(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const finishedRef = useRef(false);
  const syncStartedRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[slot === 1 ? 2 : 1];
  const videoStartAt = state?.phaseData?.videoStartAt;

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setNeedsUnlock(false);
    try {
      video.muted = false;
      await video.play();
      setStarted(true);
      setBuffering(false);
    } catch {
      setNeedsUnlock(true);
      setStarted(false);
    }
  }, []);

  const runSyncedPlayback = useCallback(async () => {
    if (syncStartedRef.current || !videoStartAt) return;
    const video = videoRef.current;
    if (!video) return;

    syncStartedRef.current = true;
    setBuffering(true);

    try {
      video.pause();
      video.currentTime = 0;
      await waitCanPlayThrough(video);
      await waitUntil(videoStartAt);
      await tryPlay();
    } catch {
      syncStartedRef.current = false;
      setBuffering(false);
    }
  }, [videoStartAt, tryPlay]);

  useEffect(() => {
    finishedRef.current = false;
    syncStartedRef.current = false;
    setNeedsUnlock(false);
    setStarted(false);
    setBuffering(true);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }
  }, []);

  useEffect(() => {
    if (!videoStartAt) return;
    runSyncedPlayback();
  }, [videoStartAt, runSyncedPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !started || !videoStartAt) return;

    const tick = () => {
      const elapsed = (Date.now() - videoStartAt) / 1000;
      if (elapsed < 0 || video.paused || needsUnlock) return;
      const drift = video.currentTime - elapsed;
      if (Math.abs(drift) > SYNC_TOLERANCE_S) {
        video.currentTime = Math.max(0, elapsed);
      }
    };

    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [started, videoStartAt, needsUnlock]);

  useEffect(() => {
    if (videoReady) finishedRef.current = true;
  }, [videoReady]);

  const handleEnded = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    emit('video-done');
  };

  const handleUnlock = async () => {
    const video = videoRef.current;
    if (!video || !videoStartAt) {
      await tryPlay();
      return;
    }
    const elapsed = (Date.now() - videoStartAt) / 1000;
    video.currentTime = Math.max(0, elapsed);
    await tryPlay();
  };

  if (videoReady && !peerReady) {
    return (
      <div className="portrait-video-stage video-phone-full z-[200] flex items-center justify-center px-6">
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
      className="portrait-video-stage video-phone-full z-[200]"
    >
      <div className="portrait-video-frame-wrap">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="portrait-video-frame"
          playsInline
          preload="auto"
          disablePictureInPicture
          onEnded={handleEnded}
          onPlay={() => {
            setStarted(true);
            setBuffering(false);
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
        ></video>
      </div>

      {buffering && !needsUnlock && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/60 pointer-events-none">
          <p className="text-sm text-zinc-400 tracking-widest uppercase">Se încarcă...</p>
        </div>
      )}

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
