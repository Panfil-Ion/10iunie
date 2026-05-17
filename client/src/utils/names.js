export function otherSlot(slot) {
  return slot === 1 ? 2 : 1;
}

export function getName(state, slot) {
  return state?.names?.[slot]?.trim() || '...';
}

export function waitingForPeer(state, slot) {
  const other = getName(state, otherSlot(slot));
  return `Se așteaptă după ${other}...`;
}

export function waitingAck(state, slot) {
  const me = getName(state, slot);
  const other = getName(state, otherSlot(slot));
  return `${me} așteaptă după ${other}...`;
}
