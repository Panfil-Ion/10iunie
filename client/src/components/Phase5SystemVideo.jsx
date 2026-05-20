import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { getName, otherSlot } from '../utils/names';
import { lockPortraitOrientation, unlockOrientation } from '../utils/videoFullscreen';
import { fitVideoToViewport } from '../utils/fitVideoToViewport';

/** Schimbă la fiecare fix video — verifici pe ecran dacă deploy-ul e nou */
export const VIDEO_UI_BUILD = 'fit-v5';

const VIDEO_SRC = `/0520.mp4?ui=${VIDEO_UI_BUILD}`;
const STUCK_MS = 5000;

const STAGE_BASE = {
  position: 'fixed',
  zIndex: 200,
  background: '#000',
  overflow: 'hidden',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
};

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
  const startedRef = useRef(false);
  const startAttemptedRef = useRef(false);
  const videoReady = state?.phaseData?.videoReady?.[slot];
  const peerReady = state?.phaseData?.videoReady?.[otherSlot(slot)];
  const peerName = getName(state, otherSlot(slot));

  const applyFit = useCallback(() => {
    fitVideoToViewport(stageRef.current, videoRef.current);
  }, []);

  const startPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || finishedRef.current) return;

    setNeedsTap(false);
    setStatus('loading');
    applyFit();

    try {
      await waitUntilReady(video);
    } catch {
      setNeedsTap(true);
      setStatus('tap');
      return;
    }

    applyFit();
    video.currentTime = 0;

    try {
      video.muted = true;
      await video.play();
      video.muted = false;
      startedRef.current = true;
      setStarted(true);
      setStatus('playing');
      requestAnimationFrame(applyFit);
    } catch {
      setNeedsTap(true);
      setStatus('tap');
    }
  }, [applyFit]);

  useLayoutEffect(() => {
    applyFit();
  });

  useEffect(() => {
    finishedRef.current = false;
    startedRef.current = false;
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

    applyFit();

    const onViewportChange = () => applyFit();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onViewportChange);
    vv?.addEventListener('scroll', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => {
      setTimeout(applyFit, 100);
      setTimeout(applyFit, 400);
    });

    const stuckTimer = setTimeout(() => {
      if (!startedRef.current && !finishedRef.current) {
        setNeedsTap(true);
        setStatus('tap');
      }
    }, STUCK_MS);

    const t = setTimeout(() => {
      if (startAttemptedRef.current) return;
      startAttemptedRef.current = true;
      startPlayback();
    }, 300);

    return () => {
      clearTimeout(t);
      clearTimeout(stuckTimer);
      vv?.removeEventListener('resize', onViewportChange);
      vv?.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      document.documentElement.classList.remove('video-phase-active');
      unlockOrientation();
    };
  }, [startPlayback, applyFit]);

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
    startPlayback();
  };

  const buildBadge = (
    <span
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 300,
        fontSize: 10,
        color: '#52525b',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}
    >
      {VIDEO_UI_BUILD}
    </span>
  );

  if (videoReady && !peerReady) {
    return (
      <div ref={stageRef} style={{ ...STAGE_BASE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: '#d4d4d8', textAlign: 'center', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: 360 }}>
          Video-ul tău s-a terminat.
          <br />
          <span style={{ color: '#71717a', display: 'block', marginTop: 16 }}>
            Se așteaptă după {peerName}...
          </span>
        </p>
        {buildBadge}
      </div>
    );
  }

  const showLoader = status === 'loading' && !started && !needsTap;
  const showTap = needsTap && !started;

  return (
    <div ref={stageRef} style={STAGE_BASE}>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={handleEnded}
        onLoadedMetadata={applyFit}
        onPlay={() => {
          startedRef.current = true;
          setStarted(true);
          setStatus('playing');
          setNeedsTap(false);
          applyFit();
        }}
        onError={() => {
          setNeedsTap(true);
          setStatus('tap');
        }}
      ></video>

      {showLoader && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            pointerEvents: 'none',
          }}
        >
          <p style={{ color: '#a1a1aa', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Se încarcă...
          </p>
        </div>
      )}

      {showTap && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            gap: 24,
            padding: 24,
          }}
        >
          <p style={{ color: '#a1a1aa', textAlign: 'center', fontSize: 14, maxWidth: 280 }}>
            Apasă pentru a porni video-ul (sunet activ)
          </p>
          <button
            type="button"
            onClick={handleTapStart}
            style={{
              padding: '16px 32px',
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#d4d4d8',
              border: '1px solid #52525b',
              borderRadius: 4,
              background: 'transparent',
            }}
          >
            [ INITIALIZE SYSTEM OVERRIDE ]
          </button>
        </div>
      )}

      {buildBadge}
    </div>
  );
}
