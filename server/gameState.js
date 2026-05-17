export const PHASES = {
  WAITING: 'WAITING',
  PHASE_1: 'PHASE_1',
  PHASE_1_SYNC: 'PHASE_1_SYNC',
  PHASE_1_UNLOCK: 'PHASE_1_UNLOCK',
  PHASE_2: 'PHASE_2',
  PHASE_2_LOADING: 'PHASE_2_LOADING',
  PHASE_2_TRANSITION: 'PHASE_2_TRANSITION',
  PHASE_3_RULES: 'PHASE_3_RULES',
  PHASE_3: 'PHASE_3',
  PHASE_3_RESULT: 'PHASE_3_RESULT',
  PHASE_4_RULES: 'PHASE_4_RULES',
  PHASE_4: 'PHASE_4',
  PHASE_4_ROUND_RESULT: 'PHASE_4_ROUND_RESULT',
  PHASE_4_GAME_RESULT: 'PHASE_4_GAME_RESULT',
  PHASE_5: 'PHASE_5',
  PHASE_5_RESULT: 'PHASE_5_RESULT',
  PHASE_6: 'PHASE_6',
};

const HOUSEHOLD_OBJECTS = [
  'O lingură', 'O telecomandă', 'Un pantof', 'O cană', 'O cheie', 'Un prosop',
  'O periuță de dinți', 'O pernă', 'O pătură', 'Un încărcător de telefon', 'O foarfecă',
  'Un pahar', 'O carte', 'O tigaie', 'Un umeraș', 'O oglindă', 'Un săpun', 'O lumânare',
  'O ramă foto', 'Un caiet', 'O pungă', 'O monedă', 'Un portofel', 'O umbrelă', 'Un șoset',
  'Un ceas', 'O pereche de ochelari', 'Un mouse', 'O tastatură', 'O perie de păr',
  'Un deodorant', 'Un burete de vase', 'O baterie', 'Un bec', 'Un pachet de șervețele',
  'O sticlă de apă', 'O farfurie', 'Un pieptene', 'O rolă de hârtie', 'O brichetă',
];

const PROFILE_WORDS = [
  'Cafea + Liniște', 'Lego', 'Dark Romance', 'Pian și Voce', 'Fără Citrice!', 'Iarna',
  'Alergat & Sală', 'Ciocolată 70%', 'Lalele Albe', 'Tort Prințul Negru', 'Psihologie',
  'Audi', 'Lumânări Parfumate', 'Frică de Înălțime', 'Croșetat',
  'Fără Machiaj', 'Călătorii', 'Business',
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
    game1: createGame1State(),
    game2: createGame2State(),
    game3: createGame3State(),
    phaseData: {
      ackReady: { 1: false, 2: false },
      cinematicReady: { 1: false, 2: false },
      revengeAlert: null,
      badgeWords: [],
    },
  };
}

export function createGame1State() {
  return {
    pressStart: { 1: null, 2: null },
    submitted: { 1: false, 2: false },
    durations: { 1: null, 2: null },
    winner: null,
    loopNext: { 1: false, 2: false },
  };
}

export function createGame2State() {
  return {
    currentRound: 1,
    roundWins: { 1: 0, 2: 0 },
    rounds: [],
    object: null,
    startTime: null,
    uploadTimes: { 1: null, 2: null },
    visionResults: { 1: null, 2: null },
    submitted: { 1: false, 2: false },
    processing: false,
    nextRoundReady: { 1: false, 2: false },
    gameWinner: null,
    loopNext: { 1: false, 2: false },
  };
}

export function createGame3State() {
  return {
    words: { 1: [], 2: [] },
    customWord: { 1: '', 2: '' },
    submitted: { 1: false, 2: false },
    aiText: '',
    generating: false,
    loopNext: { 1: false, 2: false },
  };
}

export function resetAck(room) {
  room.phaseData.ackReady = { 1: false, 2: false };
  room.phaseData.cinematicReady = { 1: false, 2: false };
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

export function bothPlayersConnected(room) {
  return room.players[1] && room.players[2];
}

export function bothSubmitted(obj) {
  return obj[1] && obj[2];
}

export function pickRandomObject(exclude = []) {
  const pool = HOUSEHOLD_OBJECTS.filter((o) => !exclude.includes(o));
  const list = pool.length ? pool : HOUSEHOLD_OBJECTS;
  return list[Math.floor(Math.random() * list.length)];
}

export function getBadgeWords() {
  return [...PROFILE_WORDS];
}

export function getName(room, slot) {
  return room.names[slot]?.trim() || '...';
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

export function calcRoundWinner(room) {
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

export function calcGame2OverallWinner(room) {
  if (room.game2.roundWins[1] > room.game2.roundWins[2]) return 1;
  if (room.game2.roundWins[2] > room.game2.roundWins[1]) return 2;
  return null;
}

export function resetGame2Round(room) {
  const used = room.game2.rounds.map((r) => r.object);
  room.game2.object = pickRandomObject(used);
  room.game2.startTime = Date.now();
  room.game2.submitted = { 1: false, 2: false };
  room.game2.uploadTimes = { 1: null, 2: null };
  room.game2.visionResults = { 1: null, 2: null };
  room.game2.processing = false;
  room.game2.nextRoundReady = { 1: false, 2: false };
}

export function initGame2(room) {
  room.game2 = createGame2State();
  resetGame2Round(room);
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
      loopNext: { ...room.game1.loopNext },
    },
    game2: {
      currentRound: room.game2.currentRound,
      roundWins: { ...room.game2.roundWins },
      rounds: room.game2.rounds.map((r) => ({ ...r })),
      object: room.game2.object,
      uploadTimes: { ...room.game2.uploadTimes },
      visionResults: { ...room.game2.visionResults },
      submitted: { ...room.game2.submitted },
      processing: room.game2.processing,
      nextRoundReady: { ...room.game2.nextRoundReady },
      gameWinner: room.game2.gameWinner,
      loopNext: { ...room.game2.loopNext },
    },
    game3: {
      words: { 1: [...room.game3.words[1]], 2: [...room.game3.words[2]] },
      submitted: { ...room.game3.submitted },
      aiText: room.game3.aiText,
      generating: room.game3.generating,
      loopNext: { ...room.game3.loopNext },
    },
    phaseData: {
      ackReady: { ...room.phaseData.ackReady },
      cinematicReady: { ...(room.phaseData.cinematicReady || { 1: false, 2: false }) },
      revengeAlert: room.phaseData.revengeAlert,
      badgeWords: room.phaseData.badgeWords || [],
    },
  };
}
