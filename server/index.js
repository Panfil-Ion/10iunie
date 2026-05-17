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
  pickRandomObject,
  getBadgeWords,
  calcGame1Winner,
  calcGame2Winner,
  serializeRoom,
  PHASES,
  TIMING,
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

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null,
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!isProd || !origin) return callback(null, true);
      const ok =
        allowedOrigins.some((o) => origin === o || origin.endsWith('.up.railway.app')) ||
        origin.includes('railway.app');
      callback(null, ok);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 15e6,
});

const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, createRoom(roomId));
  }
  return rooms.get(roomId);
}

function broadcastState(room) {
  io.to(room.id).emit('state', serializeRoom(room));
}

function advancePhase(room, newPhase, extra = {}) {
  room.phase = newPhase;
  room.phaseData = { ...room.phaseData, ...extra };
  broadcastState(room);
}

function schedulePhase(room, delayMs, callback) {
  setTimeout(() => {
    if (rooms.has(room.id) && room.phase) callback();
  }, delayMs);
}

function startPhase4Game(room) {
  room.game2.object = pickRandomObject();
  room.game2.startTime = Date.now();
  room.game2.submitted = { 1: false, 2: false };
  room.game2.uploadTimes = { 1: null, 2: null };
  room.game2.visionResults = { 1: null, 2: null };
  room.game2.winner = null;
  room.game2.processing = false;
  advancePhase(room, PHASES.PHASE_4);
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
      schedulePhase(currentRoom, TIMING.SHORT, () => {
        advancePhase(currentRoom, PHASES.PHASE_1_UNLOCK);
        schedulePhase(currentRoom, TIMING.MEDIUM, () => {
          advancePhase(currentRoom, PHASES.PHASE_2);
        });
      });
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
      advancePhase(currentRoom, PHASES.PHASE_2_TRANSITION);
      schedulePhase(currentRoom, TIMING.MEDIUM, () => {
        advancePhase(currentRoom, PHASES.PHASE_3_RULES);
        schedulePhase(currentRoom, TIMING.SHORT, () => {
          advancePhase(currentRoom, PHASES.PHASE_3);
        });
      });
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
      currentRoom.game1.continueReady = { 1: false, 2: false };
      advancePhase(currentRoom, PHASES.PHASE_3_RESULT);
    }
  });

  socket.on('phase-continue', () => {
    if (!currentRoom || !playerSlot) return;

    if (currentRoom.phase === PHASES.PHASE_3_RESULT) {
      currentRoom.game1.continueReady[playerSlot] = true;
      broadcastState(currentRoom);
      if (!bothSubmitted(currentRoom.game1.continueReady)) return;

      advancePhase(currentRoom, PHASES.PHASE_4_RULES);
      schedulePhase(currentRoom, TIMING.MEDIUM, () => {
        startPhase4Game(currentRoom);
      });
      return;
    }

    if (currentRoom.phase === PHASES.PHASE_5_RESULT) {
      currentRoom.game3.continueReady[playerSlot] = true;
      broadcastState(currentRoom);
      if (!bothSubmitted(currentRoom.game3.continueReady)) return;
      advancePhase(currentRoom, PHASES.PHASE_6);
    }
  });

  socket.on('game2-photo', async ({ base64 }) => {
    if (!currentRoom || !playerSlot || currentRoom.phase !== PHASES.PHASE_4) return;
    if (currentRoom.game2.submitted[playerSlot]) return;

    const elapsed = Date.now() - currentRoom.game2.startTime;
    currentRoom.game2.uploadTimes[playerSlot] = elapsed;
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

    const waitingOnVision =
      currentRoom.game2.submitted[1] &&
      currentRoom.game2.submitted[2] &&
      (!currentRoom.game2.visionResults[1] || !currentRoom.game2.visionResults[2]);
    currentRoom.game2.processing = waitingOnVision;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.game2.submitted)) {
      const bothDone = currentRoom.game2.visionResults[1] && currentRoom.game2.visionResults[2];
      if (bothDone) {
        currentRoom.game2.processing = false;
        const winner = calcGame2Winner(currentRoom);
        currentRoom.game2.winner = winner;
        if (winner) currentRoom.scores[winner]++;
        advancePhase(currentRoom, PHASES.PHASE_4_RESULT);
        schedulePhase(currentRoom, TIMING.MEDIUM, () => {
          currentRoom.phaseData.badgeWords = getBadgeWords(20);
          currentRoom.game3.submitted = { 1: false, 2: false };
          currentRoom.game3.continueReady = { 1: false, 2: false };
          currentRoom.game3.aiText = '';
          advancePhase(currentRoom, PHASES.PHASE_5);
        });
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
      const text = await generateProfilerAnalysis(
        room.names[1]?.trim() || 'Cineva',
        allWords1,
        room.names[2]?.trim() || 'Cineva',
        allWords2,
      );
      room.game3.aiText = text;
    } catch (err) {
      console.error('OpenAI text error:', err.message);
      room.game3.aiText =
        'AI-ul a făcut o pauză de cafea. Dar voi doi sunteți clar o combinație interesantă.';
    }

    room.game3.generating = false;
    room.game3.continueReady = { 1: false, 2: false };
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
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`10 June Sync Protocol running on port ${PORT}`);
});
