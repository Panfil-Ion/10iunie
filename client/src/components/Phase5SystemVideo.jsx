import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getName, otherSlot } from '../utils/names';
import {
  requestAppFullscreen,
  exitAppFullscreen,
  lockPortraitOrientation,
  unlockOrientation,
} from '../utils/videoFullscreen';

const VIDEO_SRC = '/0520.mp4';
const STUCK_MS = 5000;

function waitUntilReady(video, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 3) {
      resolve();
      return;
    }

    const onReady = () => cleanup(resolve);
    const onErr = () => cleanup(() => reject(new Error('load')));
    const timer = setTimeout(() => cleanup(() => reject(new Error('timeout'))), timeoutMs);

    const cleanup = (fn) => {
      clearTimeout(timer);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onErr);
      fn();
    };

    video.addEventListener('canplay', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onErr);
  });
}

export default function Phase5SystemVideo({ state, slot, emit }) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('loading');
  const finishedRef = useRef(false);
  const startAttemptedRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[otherSlot(slot)];
  const peerName = getName(state, otherSlot(slot));

  const startPlayback = useCallback(async (fromTap = false) => {
    const video = videoRef.current;
    if (!video || finishedRef.current) return;

    setNeedsTap(false);
    setStatus('loading');

    try {
      await waitUntilReady(video);
    } catch {
      setNeedsTap(true);
      setStatus('tap');
      return;
    }

    await lockPortraitOrientation();
    if (fromTap) {
      await requestAppFullscreen(stageRef.current || document.documentElement);
    }

    video.currentTime = 0;

    try {
      video.muted = true;
      await video.play();
      video.muted = false;
      setStarted(true);
      setStatus('playing');
    } catch {
      setNeedsTap(true);
      setStatus('tap');
    }
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    startAttemptedRef.current = false;
    setNeedsTap(false);
    setStarted(false);
    setStatus('loading');

    document.documentElement.classList.add('video-phase-active');
    lockPortraitOrientation();
    window.scrollTo(0, 0);

    const video = videoRef.current;
    if (video && video.readyState < 2) {
      video.load();
    }

    const stuckTimer = setTimeout(() => {
      if (!started && !finishedRef.current) {
        setNeedsTap(true);
        setStatus('tap');
      }
    }, STUCK_MS);

    const t = setTimeout(() => {
      if (startAttemptedRef.current) return;
      startAttemptedRef.current = true;
      startPlayback(false);
    }, 300);

    return () => {
      clearTimeout(t);
      clearTimeout(stuckTimer);
      document.documentElement.classList.remove('video-phase-active');
      unlockOrientation();
      exitAppFullscreen();
    };
  }, [startPlayback]);

  useEffect(() => {
    if (videoReady) finishedRef.current = true;
  }, [videoReady]);

  const handleEnded = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    emit('video-done');
  };

  const handleTapStart = () => {
    startAttemptedRef.current = true;
    startPlayback(true);
  };

  if (videoReady && !peerReady) {
    return (
      <div className="portrait-video-stage video-immersive z-[200] flex items-center justify-center px-8">
        <p className="text-xl text-zinc-300 text-center leading-relaxed max-w-md">
          Video-ul tău s-a terminat.
          <br />
          <span className="text-zinc-500 mt-4 block">Se așteaptă după {peerName}...</span>
        </p>
      </div>
    );
  }

  const showLoader = status === 'loading' && !started && !needsTap;
  const showTap = needsTap && !started;

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="portrait-video-stage video-immersive z-[200]"
    >
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
          setStatus('playing');
          setNeedsTap(false);
        }}
        onError={() => {
          setNeedsTap(true);
          setStatus('tap');
        }}
        onStalled={() => {
          if (!started) setStatus('loading');
        }}
      ></video>

      {showLoader && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black pointer-events-none">
          <p className="text-sm text-zinc-400 tracking-widest uppercase">Se încarcă...</p>
        </div>
      )}

      {showTap && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-6 px-6">
          <p className="text-zinc-400 text-center text-sm max-w-xs">
            Apasă pentru a porni video-ul (sunet activ)
          </p>
          <button
            type="button"
            onClick={handleTapStart}
            className="px-8 py-4 font-mono text-sm md:text-base tracking-[0.2em] uppercase text-zinc-300 border border-zinc-600 rounded hover:border-white hover:text-white transition-colors duration-500"
          >
            [ INITIALIZE SYSTEM OVERRIDE ]
          </button>
        </div>
      )}
    </motion.div>
  );
}
