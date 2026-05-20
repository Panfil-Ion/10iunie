import { useEffect, useRef } from 'react';

const VIDEO_SRC = '/0520.mp4';

/** Încarcă video-ul în fundal în timpul ecranului cu căști. */
export default function VideoPreloader({ active }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    el.load();
  }, [active]);

  if (!active) return null;

  return (
    <video
      ref={ref}
      src={VIDEO_SRC}
      preload="auto"
      playsInline
      muted
      className="hidden"
      aria-hidden
    ></video>
  );
}
