import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getName, otherSlot } from '../utils/names';
import {
  requestAppFullscreen,
  exitAppFullscreen,
  lockPortraitOrientation,
  unlockOrientation,
  tryNativeVideoFullscreen,
} from '../utils/videoFullscreen';

const VIDEO_SRC = '/0520.mp4';

export default function Phase5SystemVideo({ state, slot, emit }) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const finishedRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[otherSlot(slot)];
  const peerName = getName(state, otherSlot(slot));

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setNeedsUnlock(false);
    await lockPortraitOrientation();
    await requestAppFullscreen(stageRef.current || document.documentElement);

    try {
      video.muted = false;
      await video.play();
      tryNativeVideoFullscreen(video);
      setStarted(true);
      setBuffering(false);
    } catch {
      setNeedsUnlock(true);
      setStarted(false);
    }
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    setNeedsUnlock(false);
    setStarted(false);
    setBuffering(true);

    document.documentElement.classList.add('video-phase-active');
    lockPortraitOrientation();
    requestAppFullscreen(document.documentElement);
    window.scrollTo(0, 0);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }

    const t = setTimeout(() => tryPlay(), 150);

    return () => {
      clearTimeout(t);
      document.documentElement.classList.remove('video-phase-active');
      unlockOrientation();
      exitAppFullscreen();
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
      <div className="portrait-video-stage video-immersive z-[200] flex items-center justify-center px-8">
        <p className="text-xl text-zinc-300 text-center leading-relaxed max-w-md">
          Video-ul tău s-a terminat.
          <br />
          <span className="text-zinc-500 mt-4 block">Se așteaptă după {peerName}...</span>
        </p>
      </div>
    );
  }

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
          setBuffering(false);
          tryNativeVideoFullscreen(videoRef.current);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
      ></video>

      {buffering && !started && !needsUnlock && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black pointer-events-none">
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
