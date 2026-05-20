/** Dimensiune video strict în zona vizibilă a telefonului (fără overflow). */
export function fitVideoToViewport(stageEl, videoEl) {
  if (!stageEl) return;

  const vv = window.visualViewport;
  const top = vv?.offsetTop ?? 0;
  const left = vv?.offsetLeft ?? 0;
  const w = Math.floor(vv?.width ?? window.innerWidth);
  const h = Math.floor(vv?.height ?? window.innerHeight);

  stageEl.style.position = 'fixed';
  stageEl.style.top = `${top}px`;
  stageEl.style.left = `${left}px`;
  stageEl.style.right = 'auto';
  stageEl.style.bottom = 'auto';
  stageEl.style.width = `${w}px`;
  stageEl.style.height = `${h}px`;
  stageEl.style.maxWidth = `${w}px`;
  stageEl.style.maxHeight = `${h}px`;
  stageEl.style.overflow = 'hidden';
  stageEl.style.boxSizing = 'border-box';
  stageEl.style.background = '#000';

  if (!videoEl) return;

  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;

  videoEl.style.position = 'absolute';
  videoEl.style.top = '50%';
  videoEl.style.left = '50%';
  videoEl.style.transform = 'translate(-50%, -50%)';
  videoEl.style.objectFit = 'contain';
  videoEl.style.objectPosition = 'center center';

  if (!vw || !vh) {
    videoEl.style.width = 'auto';
    videoEl.style.height = 'auto';
    videoEl.style.maxWidth = `${w}px`;
    videoEl.style.maxHeight = `${h}px`;
    return;
  }

  const scale = Math.min(w / vw, h / vh);
  const dw = Math.floor(vw * scale);
  const dh = Math.floor(vh * scale);

  videoEl.style.width = `${dw}px`;
  videoEl.style.height = `${dh}px`;
  videoEl.style.maxWidth = `${w}px`;
  videoEl.style.maxHeight = `${h}px`;
}
