/** Orientare portrait la video — fără fullscreen (fullscreen rupe limitele pe mobil). */

export function lockPortraitOrientation() {
  const o = screen.orientation;
  if (!o?.lock) return Promise.resolve();
  return o.lock('portrait').catch(() => {});
}

export function unlockOrientation() {
  screen.orientation?.unlock?.();
}

export function prepareVideoImmersion() {
  return lockPortraitOrientation();
}
