export const PHASES = {
  WAITING: 'WAITING',
  PHASE_1: 'PHASE_1',
  PHASE_1_SYNC: 'PHASE_1_SYNC',
  PHASE_2: 'PHASE_2',
  PHASE_2_UNLOCK: 'PHASE_2_UNLOCK',
  PHASE_3: 'PHASE_3',
  PHASE_3_RESULT: 'PHASE_3_RESULT',
  PHASE_4_INTRO: 'PHASE_4_INTRO',
  PHASE_4: 'PHASE_4',
  PHASE_4_RESULT: 'PHASE_4_RESULT',
  PHASE_5_INTRO: 'PHASE_5_INTRO',
  PHASE_5: 'PHASE_5',
  PHASE_5_RESULT: 'PHASE_5_RESULT',
  PHASE_6: 'PHASE_6',
  PHASE_6_END: 'PHASE_6_END',
};

const OBJECTS = [
  'ceas', 'cană', 'carte', 'telefon', 'cheie', 'ochelari', 'stilou',
  'flori', 'pantaloni', 'ceas de perete', 'laptop', 'pernă', 'sticlă de apă',
  'portofel', 'ceas de mână', 'căști', 'mouse', 'tastatură', 'lampă', 'oglindă',
];

const BADGE_WORDS = [
  'Haos', 'Somn', 'Cafea', 'Procrastinare', 'Memes', 'Playlist-uri triste',
  'Sarcasm', 'Pizza', 'Scroll infinit', 'Deadline-uri', 'Filme la 2AM',
  'Organizare zero', 'Vibes', 'Overthinking', 'Snack-uri', 'Playlist de vară',
  'Filme romantice', 'Gaming', 'Plante moarte', 'Notificări', 'Chaos energy',
  'Duminică', 'Playlist de iarnă', 'Căutări Google la 3AM',
];

export function createRoom(roomId) {
  return {
    id: roomId,
    phase: PHASES.WAITING,
    players: { 1: null, 2: null },
    names: { 1: '', 2: '' },
    nameSubmitted: { 1: false, 2: false },
    dates: { 1: '', 2: '' },
    dateSubmitted: { 1: false, 2: false },
    scores: { 1: 0, 2: 0 },
    game1: {
      pressStart: { 1: null, 2: null },
      pressEnd: { 1: null, 2: null },
      submitted: { 1: false, 2: false },
      durations: { 1: null, 2: null },
      winner: null,
    },
    game2: {
      object: null,
      startTime: null,
      uploads: { 1: null, 2: null },
      uploadTimes: { 1: null, 2: null },
      visionResults: { 1: null, 2: null },
      submitted: { 1: false, 2: false },
      winner: null,
      processing: false,
    },
    game3: {
      words: { 1: [], 2: [] },
      customWord: { 1: '', 2: '' },
      submitted: { 1: false, 2: false },
      aiText: '',
      generating: false,
    },
    phaseData: {},
  };
}

export function assignPlayer(room, socketId) {
  if (!room.players[1]) {
    room.players[1] = socketId;
    return 1;
  }
  if (!room.players[2]) {
    room.players[2] = socketId;
    return 2;
  }
  return null;
}

export function getPlayerSlot(room, socketId) {
  if (room.players[1] === socketId) return 1;
  if (room.players[2] === socketId) return 2;
  return null;
}

export function bothPlayersConnected(room) {
  return room.players[1] && room.players[2];
}

export function bothSubmitted(obj) {
  return obj[1] && obj[2];
}

export function pickRandomObject() {
  return OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
}

export function getBadgeWords(count = 20) {
  const shuffled = [...BADGE_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function calcGame1Winner(room) {
  const d1 = room.game1.durations[1];
  const d2 = room.game1.durations[2];
  const diff1 = Math.abs(d1 - 10);
  const diff2 = Math.abs(d2 - 10);
  if (diff1 < diff2) return 1;
  if (diff2 < diff1) return 2;
  return null;
}

export function calcGame2Winner(room) {
  const r1 = room.game2.visionResults[1];
  const r2 = room.game2.visionResults[2];
  const t1 = room.game2.uploadTimes[1];
  const t2 = room.game2.uploadTimes[2];
  if (r1 === 'DA' && r2 === 'DA') {
    if (t1 < t2) return 1;
    if (t2 < t1) return 2;
    return null;
  }
  if (r1 === 'DA') return 1;
  if (r2 === 'DA') return 2;
  return null;
}

export function serializeRoom(room) {
  return {
    id: room.id,
    phase: room.phase,
    names: { ...room.names },
    nameSubmitted: { ...room.nameSubmitted },
    dates: { ...room.dates },
    dateSubmitted: { ...room.dateSubmitted },
    scores: { ...room.scores },
    game1: {
      durations: { ...room.game1.durations },
      submitted: { ...room.game1.submitted },
      winner: room.game1.winner,
    },
    game2: {
      object: room.game2.object,
      startTime: room.game2.startTime,
      uploadTimes: { ...room.game2.uploadTimes },
      visionResults: { ...room.game2.visionResults },
      submitted: { ...room.game2.submitted },
      winner: room.game2.winner,
      processing: room.game2.processing,
    },
    game3: {
      words: { 1: [...room.game3.words[1]], 2: [...room.game3.words[2]] },
      submitted: { ...room.game3.submitted },
      aiText: room.game3.aiText,
      generating: room.game3.generating,
    },
    badgeWords: room.phaseData.badgeWords || [],
    phaseData: room.phaseData,
  };
}
