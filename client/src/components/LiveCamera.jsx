import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BTN_SUBMIT } from '../styles';

export default function LiveCamera({ object, onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const shotLockRef = useRef(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const markReadyIfPossible = useCallback(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      setReady(true);
      setError(null);
    }
  }, []);

  const attachStreamToVideo = useCallback(async (videoEl) => {
    if (!videoEl || !streamRef.current) return;
    if (videoEl.srcObject !== streamRef.current) {
      videoEl.srcObject = streamRef.current;
    }
    try {
      await videoEl.play();
    } catch {
      // iOS: play() poate eșua până la primul tap — rezolvăm la apăsarea butonului
    }
    markReadyIfPossible();
  }, [markReadyIfPossible]);

  const setVideoRef = useCallback(
    (node) => {
      videoRef.current = node;
      if (node) attachStreamToVideo(node);
    },
    [attachStreamToVideo]
  );

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera indisponibilă. Deschide linkul prin HTTPS (nu din preview).');
        return;
      }

      const tries = [
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false },
      ];

      let stream = null;
      for (const constraints of tries) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch {
          /* încearcă următoarea constrângere */
        }
      }

      if (!active) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setError('Nu am putut accesa camera. Permite accesul în setările browserului.');
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) await attachStreamToVideo(videoRef.current);
    }

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [attachStreamToVideo]);

  const takePhoto = useCallback(async () => {
    if (disabled || capturing || shotLockRef.current) return;
    shotLockRef.current = true;

    const video = videoRef.current;
    if (!video || !streamRef.current) {
      setError('Camera nu e pregătită. Așteaptă un moment.');
      shotLockRef.current = false;
      return;
    }

    setError(null);

    try {
      await video.play();
    } catch {
      /* continuă — unele browsere au deja stream activ */
    }

    markReadyIfPossible();

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError('Camera se încărcă… apasă din nou peste o secundă.');
      shotLockRef.current = false;
      return;
    }

    setCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponibil');
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (!dataUrl || dataUrl.length < 200) {
        throw new Error('Imagine goală');
      }
      onCapture(dataUrl);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Nu s-a putut face poza. Încearcă din nou.');
      setCapturing(false);
      shotLockRef.current = false;
    }
  }, [disabled, capturing, markReadyIfPossible, onCapture]);

  if (error && !streamRef.current) {
    return <p className="text-lg text-red-400 text-center px-4">{error}</p>;
  }

  const shutterDisabled = disabled || capturing;

  return (
    <motion.div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <p className="text-lg text-zinc-300 text-center">
        Obiect: <span className="text-white font-bold">{object}</span>
      </p>
      <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border-2 border-zinc-600">
        <video
          ref={setVideoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={markReadyIfPossible}
          onLoadedData={markReadyIfPossible}
          onPlaying={markReadyIfPossible}
          className="w-full h-full object-cover"
        />
        {!ready && (
          <motion.div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none bg-black/40">
            Se pornește camera...
          </motion.div>
        )}
      </motion.div>

      {error && (
        <p className="text-base text-amber-400 text-center px-2">{error}</p>
      )}

      <button
        type="button"
        onPointerUp={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.preventDefault();
          takePhoto();
        }}
        disabled={shutterDisabled}
        className={`${BTN_SUBMIT} w-full bg-white text-zinc-950 border-white hover:bg-zinc-200 touch-manipulation select-none active:scale-[0.98] disabled:opacity-40`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {capturing ? 'Se trimite...' : '[ FĂ POZA ]'}
      </button>

      {!ready && !error && (
        <p className="text-sm text-zinc-500 text-center">
          Dacă vezi imaginea dar butonul nu merge, apasă o dată pe ecranul camerei, apoi pe buton.
        </p>
      )}
    </motion.div>
  );
}
