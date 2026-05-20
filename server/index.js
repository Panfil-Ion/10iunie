import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRoom,
  assignPlayer,
  bothPlayersConnected,
  bothSubmitted,
  getBadgeWords,
  calcGame1Winner,
  calcRoundWinner,
  calcGame2OverallWinner,
  serializeRoom,
  resetAck,
  createGame1State,
  createGame3State,
  initGame2,
  resetGame2Round,
  getName,
  PHASES,
} from './gameState.js';
import { verifyObjectInImage, generateProfilerAnalysis } from './openai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT !== undefined;

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!isProd || !origin) return callback(null, true);
      const ok =
        origin.endsWith('.up.railway.app') || origin.includes('railway.app') || origin.includes('localhost');
      callback(null, ok);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 15e6,
});

const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, createRoom(roomId));
  return rooms.get(roomId);
}

function broadcastState(room) {
  io.to(room.id).emit('state', serializeRoom(room));
}

function advancePhase(room, newPhase) {
  resetAck(room);
  room.phase = newPhase;
  broadcastState(room);
}

function setRevengeAlert(room, slot) {
  room.phaseData.revengeAlert = { from: slot, name: getName(room, slot) };
  broadcastState(room);
  setTimeout(() => {
    if (rooms.has(room.id)) {
      room.phaseData.revengeAlert = null;
      broadcastState(room);
    }
  }, 3000);
}

function advanceFromCinematic(room) {
  switch (room.phase) {
    case PHASES.PHASE_1_SYNC:
      advancePhase(room, PHASES.PHASE_1_UNLOCK);
      break;
    case PHASES.PHASE_1_UNLOCK:
      advancePhase(room, PHASES.PHASE_2);
      break;
    case PHASES.PHASE_2_LOADING:
      advancePhase(room, PHASES.PHASE_2_TRANSITION);
      break;
    default:
      break;
  }
}

const CINEMATIC_PHASES = new Set([
  PHASES.PHASE_1_SYNC,
  PHASES.PHASE_1_UNLOCK,
  PHASES.PHASE_2_LOADING,
]);

function advanceFromAck(room) {
  switch (room.phase) {
    case PHASES.PHASE_2_TRANSITION:
      advancePhase(room, PHASES.PHASE_3_RULES);
      break;
    case PHASES.PHASE_3_RULES:
      advancePhase(room, PHASES.PHASE_3);
      break;
    case PHASES.PHASE_4_RULES:
      initGame2(room);
      advancePhase(room, PHASES.PHASE_4);
      break;
    case PHASES.PHASE_5_VIDEO_PREP:
      advancePhase(room, PHASES.PHASE_5_VIDEO);
      broadcastState(room);
      break;
    default:
      break;
  }
}

function finishGame2Round(room) {
  const roundWinner = calcRoundWinner(room);
  if (roundWinner) room.game2.roundWins[roundWinner]++;

  room.game2.rounds.push({
    round: room.game2.currentRound,
    object: room.game2.object,
    winner: roundWinner,
    visionResults: { ...room.game2.visionResults },
    uploadTimes: { ...room.game2.uploadTimes },
  });

  if (room.game2.currentRound < 3) {
    room.game2.nextRoundReady = { 1: false, 2: false };
    advancePhase(room, PHASES.PHASE_4_ROUND_RESULT);
    return;
  }

  const gameWinner = calcGame2OverallWinner(room);
  room.game2.gameWinner = gameWinner;
  if (gameWinner) room.scores[gameWinner]++;
  room.game2.loopNext = { 1: false, 2: false };
  advancePhase(room, PHASES.PHASE_4_GAME_RESULT);
}

function retryGame1(room, slot) {
  room.game1 = createGame1State();
  setRevengeAlert(room, slot);
  advancePhase(room, PHASES.PHASE_3);
}

function retryGame2(room, slot) {
  initGame2(room);
  setRevengeAlert(room, slot);
  advancePhase(room, PHASES.PHASE_4);
}

function retryGame3(room, slot) {
  room.game3 = createGame3State();
  setRevengeAlert(room, slot);
  advancePhase(room, PHASES.PHASE_5);
}

function tryAdvanceFromNext(room, gameNum) {
  const gameKey = `game${gameNum}`;
  const g = room[gameKey];
  if (!bothSubmitted(g.loopNext)) return;

  g.loopNext = { 1: false, 2: false };

  if (gameNum === 1) {
    advancePhase(room, PHASES.PHASE_4_RULES);
  } else if (gameNum === 2) {
    room.phaseData.badgeWords = getBadgeWords();
    advancePhase(room, PHASES.PHASE_5);
  } else if (gameNum === 3) {
    advancePhase(room, PHASES.PHASE_5_VIDEO_PREP);
  }
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let playerSlot = null;

  socket.on('join', ({ roomId }) => {
    const id = (roomId || 'sync-protocol').toLowerCase().trim();
    const room = getOrCreateRoom(id);
    const slot = assignPlayer(room, socket.id);

    if (!slot) {
      socket.emit('error', { message: 'Camera este plină. Maxim 2 jucători.' });
      return;
    }

    currentRoom = room;
    playerSlot = slot;
    socket.join(id);

    if (bothPlayersConnected(room) && room.phase === PHASES.WAITING) {
      room.phase = PHASES.PHASE_1;
    }

    socket.emit('joined', { slot, roomId: id });
    broadcastState(room);
  });

  socket.on('name-typing', ({ value }) => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.names[playerSlot] = value;
    socket.to(currentRoom.id).emit('peer-typing', { field: 'name', slot: playerSlot, value });
  });

  socket.on('name-submit', ({ value }) => {
    if (!currentRoom || !playerSlot) return;
    if (value?.trim()) currentRoom.names[playerSlot] = value.trim();
    currentRoom.nameSubmitted[playerSlot] = true;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.nameSubmitted) && currentRoom.phase === PHASES.PHASE_1) {
      advancePhase(currentRoom, PHASES.PHASE_1_SYNC);
    }
  });

  socket.on('date-typing', ({ value }) => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.dates[playerSlot] = value;
    socket.to(currentRoom.id).emit('peer-typing', { field: 'date', slot: playerSlot, value });
  });

  socket.on('date-submit', () => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.dateSubmitted[playerSlot] = true;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.dateSubmitted) && currentRoom.phase === PHASES.PHASE_2) {
      advancePhase(currentRoom, PHASES.PHASE_2_LOADING);
    }
  });

  socket.on('cinematic-done', () => {
    if (!currentRoom || !playerSlot) return;
    if (!CINEMATIC_PHASES.has(currentRoom.phase)) return;
    if (!currentRoom.phaseData.cinematicReady) {
      currentRoom.phaseData.cinematicReady = { 1: false, 2: false };
    }
    currentRoom.phaseData.cinematicReady[playerSlot] = true;
    broadcastState(currentRoom);
    if (bothSubmitted(currentRoom.phaseData.cinematicReady)) {
      advanceFromCinematic(currentRoom);
    }
  });

  socket.on('screen-ack', () => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.phaseData.ackReady[playerSlot] = true;
    broadcastState(currentRoom);
    if (bothSubmitted(currentRoom.phaseData.ackReady)) {
      advanceFromAck(currentRoom);
    }
  });

  socket.on('video-done', () => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_5_VIDEO) return;
    currentRoom.phaseData.videoReady[playerSlot] = true;
    broadcastState(currentRoom);
    if (bothSubmitted(currentRoom.phaseData.videoReady)) {
      advancePhase(currentRoom, PHASES.PHASE_6);
    }
  });

  socket.on('game1-down', () => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_3) return;
    currentRoom.game1.pressStart[playerSlot] = Date.now();
  });

  socket.on('game1-up', () => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_3) return;
    const start = currentRoom.game1.pressStart[playerSlot];
    if (!start) return;
    const duration = (Date.now() - start) / 1000;
    currentRoom.game1.durations[playerSlot] = Math.round(duration * 100) / 100;
    currentRoom.game1.submitted[playerSlot] = true;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.game1.submitted)) {
      const winner = calcGame1Winner(currentRoom);
      currentRoom.game1.winner = winner;
      if (winner) currentRoom.scores[winner]++;
      currentRoom.game1.loopNext = { 1: false, 2: false };
      advancePhase(currentRoom, PHASES.PHASE_3_RESULT);
    }
  });

  socket.on('game-loop-action', ({ game, action }) => {
    if (!currentRoom || !playerSlot) return;
    const g = Number(game);

    if (action === 'retry') {
      if (g === 1) retryGame1(currentRoom, playerSlot);
      else if (g === 2) retryGame2(currentRoom, playerSlot);
      else if (g === 3) retryGame3(currentRoom, playerSlot);
      return;
    }

    if (action === 'next') {
      if (g === 1 && currentRoom.phase === PHASES.PHASE_3_RESULT) {
        currentRoom.game1.loopNext[playerSlot] = true;
        broadcastState(currentRoom);
        tryAdvanceFromNext(currentRoom, 1);
      } else if (g === 2 && currentRoom.phase === PHASES.PHASE_4_GAME_RESULT) {
        currentRoom.game2.loopNext[playerSlot] = true;
        broadcastState(currentRoom);
        tryAdvanceFromNext(currentRoom, 2);
      } else if (g === 3 && currentRoom.phase === PHASES.PHASE_5_RESULT) {
        currentRoom.game3.loopNext[playerSlot] = true;
        broadcastState(currentRoom);
        tryAdvanceFromNext(currentRoom, 3);
      }
    }
  });

  socket.on('game2-next-round', () => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_4_ROUND_RESULT) return;
    currentRoom.game2.nextRoundReady[playerSlot] = true;
    broadcastState(currentRoom);

    if (!bothSubmitted(currentRoom.game2.nextRoundReady)) return;

    currentRoom.game2.currentRound++;
    resetGame2Round(currentRoom);
    advancePhase(currentRoom, PHASES.PHASE_4);
  });

  socket.on('game2-photo', async ({ base64 }) => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_4) return;
    if (currentRoom.game2.submitted[playerSlot]) return;

    currentRoom.game2.uploadTimes[playerSlot] = Date.now() - currentRoom.game2.startTime;
    currentRoom.game2.submitted[playerSlot] = true;
    currentRoom.game2.processing = true;
    broadcastState(currentRoom);

    try {
      const result = await verifyObjectInImage(base64, currentRoom.game2.object);
      currentRoom.game2.visionResults[playerSlot] = result;
    } catch (err) {
      console.error('Vision API error:', err.message);
      currentRoom.game2.visionResults[playerSlot] = 'NU';
    }

    const waiting =
      currentRoom.game2.submitted[1] &&
      currentRoom.game2.submitted[2] &&
      (!currentRoom.game2.visionResults[1] || !currentRoom.game2.visionResults[2]);
    currentRoom.game2.processing = waiting;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.game2.submitted)) {
      const bothDone = currentRoom.game2.visionResults[1] && currentRoom.game2.visionResults[2];
      if (bothDone) {
        currentRoom.game2.processing = false;
        finishGame2Round(currentRoom);
      }
    }
  });

  socket.on('game3-words', ({ words, customWord }) => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_5) return;
    currentRoom.game3.words[playerSlot] = words.slice(0, 3);
    if (customWord) currentRoom.game3.customWord[playerSlot] = customWord;
    currentRoom.game3.submitted[playerSlot] = true;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.game3.submitted)) {
      processGame3(currentRoom);
    }
  });

  async function processGame3(room) {
    room.game3.generating = true;
    broadcastState(room);

    const allWords1 = [...room.game3.words[1], room.game3.customWord[1]].filter(Boolean);
    const allWords2 = [...room.game3.words[2], room.game3.customWord[2]].filter(Boolean);

    try {
      room.game3.aiText = await generateProfilerAnalysis(
        getName(room, 1),
        allWords1,
        getName(room, 2),
        allWords2,
      );
    } catch (err) {
      console.error('OpenAI text error:', err.message);
      room.game3.aiText = 'AI-ul a făcut o pauză de cafea. Dar voi doi sunteți clar o combinație interesantă.';
    }

    room.game3.generating = false;
    room.game3.loopNext = { 1: false, 2: false };
    advancePhase(room, PHASES.PHASE_5_RESULT);
  }

  socket.on('disconnect', () => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.players[playerSlot] = null;
    broadcastState(currentRoom);
  });
});

if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(
    express.static(clientDist, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Accept-Ranges', 'bytes');
        } else if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, videoUi: 'fit-v5' });
});

app.get('/api/build', (_req, res) => {
  res.json({ videoUi: 'fit-v5' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`10 June Sync Protocol running on port ${PORT}`);
});
