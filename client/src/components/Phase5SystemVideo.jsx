import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { waitingForPeer } from '../utils/names';

const VIDEO_SRC = '/0520.mp4';
const SYNC_DRIFT_S = 0.2;

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

export default function Phase5SystemVideo({
  state,
  slot,
  emit,
  videoPlayAt,
  videoSyncPos,
}) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const finishedRef = useRef(false);
  const bufferedSentRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[slot === 1 ? 2 : 1];
  const peerBuffered = state?.phaseData?.videoBuffered?.[slot === 1 ? 2 : 1];
  const iBuffered = state?.phaseData?.videoBuffered?.[slot];

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    setNeedsUnlock(false);
    try {
      video.muted = false;
      await video.play();
      setStarted(true);
      setBuffering(false);
      return true;
    } catch {
      setNeedsUnlock(true);
      setStarted(false);
      return false;
    }
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    bufferedSentRef.current = false;
    setNeedsUnlock(false);
    setStarted(false);
    setBuffering(true);

    document.documentElement.classList.add('video-phase-active');
    window.scrollTo(0, 0);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }

    return () => {
      document.documentElement.classList.remove('video-phase-active');
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || bufferedSentRef.current) return;

    let cancelled = false;

    (async () => {
      await waitCanPlayThrough(video);
      if (cancelled || bufferedSentRef.current) return;
      bufferedSentRef.current = true;
      emit('video-buffered');
    })();

    return () => {
      cancelled = true;
    };
  }, [emit]);

  useEffect(() => {
    if (!videoPlayAt) return;
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    tryPlay();

    const el = stageRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, [videoPlayAt, tryPlay]);

  useEffect(() => {
    if (videoSyncPos == null) return;
    const video = videoRef.current;
    if (!video || needsUnlock) return;

    const drift = Math.abs(video.currentTime - videoSyncPos);
    if (drift > SYNC_DRIFT_S) {
      video.currentTime = videoSyncPos;
    }
    if (video.paused && !needsUnlock) {
      tryPlay();
    }
  }, [videoSyncPos, needsUnlock, tryPlay]);

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
    if (video && videoSyncPos != null) {
      video.currentTime = videoSyncPos;
    }
    await tryPlay();
  };

  if (videoReady && !peerReady) {
    return (
      <div className="portrait-video-stage video-phone-fit z-[200] flex items-center justify-center px-6">
        <p className="text-lg text-zinc-500 text-center tracking-wide">
          {waitingForPeer(state, slot)}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="portrait-video-stage video-phone-fit z-[200]"
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

      {buffering && !started && !needsUnlock && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-black/80 pointer-events-none gap-3 px-6">
          <p className="text-sm text-zinc-400 tracking-widest uppercase text-center">
            Se încarcă...
          </p>
          {iBuffered && !peerBuffered && (
            <p className="text-xs text-zinc-500 text-center">{waitingForPeer(state, slot)}</p>
          )}
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
