/** Dimensiune video în pixeli — zona vizibilă reală (visualViewport). */
export function fitVideoToViewport(stageEl, videoEl) {
  if (!stageEl) return;

  const vv = window.visualViewport;
  const top = Math.max(0, Math.floor(vv?.offsetTop ?? 0));
  const left = Math.max(0, Math.floor(vv?.offsetLeft ?? 0));
  const w = Math.floor(vv?.width ?? window.innerWidth);
  const h = Math.floor(vv?.height ?? window.innerHeight);

  stageEl.style.cssText = [
    'position:fixed',
    `top:${top}px`,
    `left:${left}px`,
    `width:${w}px`,
    `height:${h}px`,
    `max-width:${w}px`,
    `max-height:${h}px`,
    'right:auto',
    'bottom:auto',
    'margin:0',
    'padding:0',
    'overflow:hidden',
    'box-sizing:border-box',
    'background:#000',
    'z-index:200',
  ].join(';');

  if (!videoEl) return;

  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;

  if (!vw || !vh) {
    videoEl.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:auto',
      'height:auto',
      `max-width:${w}px`,
      `max-height:${h}px`,
      'object-fit:contain',
      'object-position:center',
    ].join(';');
    return;
  }

  const scale = Math.min(w / vw, h / vh);
  const dw = Math.floor(vw * scale);
  const dh = Math.floor(vh * scale);

  videoEl.style.cssText = [
    'position:absolute',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    `width:${dw}px`,
    `height:${dh}px`,
    `max-width:${w}px`,
    `max-height:${h}px`,
    'object-fit:contain',
    'object-position:center',
  ].join(';');
}
