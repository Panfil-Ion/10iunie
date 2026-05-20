/** Fullscreen + orientare portrait pentru faza video. */

export function requestAppFullscreen(el = document.documentElement) {
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen;
  if (!fn) return Promise.resolve();
  try {
    return Promise.resolve(fn.call(el));
  } catch {
    return Promise.resolve();
  }
}

export function exitAppFullscreen() {
  const fn =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;
  if (document.fullscreenElement && fn) {
    try {
      fn.call(document);
    } catch {
      /* ignore */
    }
  }
}

export function lockPortraitOrientation() {
  const o = screen.orientation;
  if (!o?.lock) return Promise.resolve();
  return o.lock('portrait').catch(() => {});
}

export function unlockOrientation() {
  screen.orientation?.unlock?.();
}

/** Pregătire imersivă — apelat la tap pe „Am înțeles” (gest utilizator). */
export function prepareVideoImmersion() {
  lockPortraitOrientation();
  return requestAppFullscreen();
}

/** iOS Safari: ascunde bara browserului pe video. */
export function tryNativeVideoFullscreen(video) {
  if (video?.webkitEnterFullscreen) {
    try {
      video.webkitEnterFullscreen();
      return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}
