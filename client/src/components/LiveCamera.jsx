import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BTN_SUBMIT } from '../styles';

export default function LiveCamera({ object, onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Nu am putut accesa camera. Permite accesul în setările browserului.');
      }
    }

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready || disabled) return;

    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    onCapture(canvas.toDataURL('image/jpeg', 0.88));
  };

  if (error) {
    return <p className="text-lg text-red-400 text-center px-4">{error}</p>;
  }

  return (
    <motion.div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <p className="text-lg text-zinc-300 text-center">
        Obiect: <span className="text-white font-bold">{object}</span>
      </p>
      <motion.div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border-2 border-zinc-600">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />
        {!ready && (
          <motion.div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            Se pornește camera...
          </motion.div>
        )}
      </motion.div>
      <button
        type="button"
        onClick={capture}
        disabled={!ready || disabled}
        className={`${BTN_SUBMIT} w-full bg-white text-zinc-950 border-white hover:bg-zinc-200`}
      >
        [ FĂ POZA ]
      </button>
    </motion.div>
  );
}
