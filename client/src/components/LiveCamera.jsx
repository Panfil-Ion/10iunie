import { useEffect, useRef, useState } from 'react';
import { BTN_SUBMIT } from '../styles';

export default function LiveCamera({ object, onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera necesita HTTPS si browser modern.');
        return;
      }

      const options = [
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false },
      ];

      let stream = null;
      for (const opts of options) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(opts);
          break;
        } catch {
          /* next */
        }
      }

      if (!alive) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setError('Permite accesul la camera in browser.');
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        try {
          await video.play();
        } catch {
          /* unele telefoane pornesc la primul tap */
        }
      }
    }

    start();

    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  async function handleShutter() {
    if (disabled || busy) return;

    const video = videoRef.current;
    if (!video) {
      setError('Camera nu e gata.');
      return;
    }

    if (!streamRef.current) {
      setError('Stream camera lipseste. Reincarca pagina.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (!video.srcObject) {
        video.srcObject = streamRef.current;
      }
      await video.play();
    } catch {
      /* ok */
    }

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setBusy(false);
      setError('Asteapta 1 secunda si incearca din nou.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);
      if (!base64 || base64.length < 500) {
        throw new Error('empty');
      }
      onCapture(base64);
    } catch {
      setBusy(false);
      setError('Nu s-a putut captura poza.');
    }
  }

  const objectLabel = object ? object.toUpperCase() : '...';

  return (
    <div className="game2-camera-root relative z-10">
      <div className="game2-camera-view relative bg-black rounded-xl overflow-hidden border-2 border-zinc-600">
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {error && <p className="text-base text-amber-400 text-center px-2 shrink-0">{error}</p>}

      <button
        type="button"
        onClick={handleShutter}
        disabled={disabled || busy}
        className={`${BTN_SUBMIT} game2-shutter-btn relative z-20 bg-white text-zinc-950 border-white hover:bg-zinc-200 touch-manipulation min-h-[56px]`}
      >
        {busy ? 'Se trimite...' : 'FĂ POZA'}
      </button>

      <p className="game2-object-label text-3xl text-white font-bold text-center px-2 leading-tight">
        Găsește: {objectLabel}
      </p>
    </div>
  );
}
