import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRoom,
  assignPlayer,
  getPlayerSlot,
  bothPlayersConnected,
  bothSubmitted,
  pickRandomObject,
  getBadgeWords,
  calcGame1Winner,
  calcGame2Winner,
  serializeRoom,
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
    if (rooms.has(room.id)) callback();
  }, delayMs);
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

  socket.on('name-submit', () => {
    if (!currentRoom || !playerSlot) return;
    currentRoom.nameSubmitted[playerSlot] = true;
    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.nameSubmitted) && currentRoom.phase === PHASES.PHASE_1) {
      advancePhase(currentRoom, PHASES.PHASE_1_SYNC);
      schedulePhase(currentRoom, 1500, () => {
        advancePhase(currentRoom, PHASES.PHASE_2);
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
      advancePhase(currentRoom, PHASES.PHASE_2_UNLOCK);
      schedulePhase(currentRoom, 3000, () => {
        advancePhase(currentRoom, PHASES.PHASE_3);
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
      advancePhase(currentRoom, PHASES.PHASE_3_RESULT);
      schedulePhase(currentRoom, 4000, () => {
        advancePhase(currentRoom, PHASES.PHASE_4_INTRO);
        schedulePhase(currentRoom, 3000, () => {
          currentRoom.game2.object = pickRandomObject();
          currentRoom.game2.startTime = Date.now();
          advancePhase(currentRoom, PHASES.PHASE_4);
        });
      });
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

    currentRoom.game2.processing =
      currentRoom.game2.submitted[1] &&
      currentRoom.game2.submitted[2] &&
      (!currentRoom.game2.visionResults[1] || !currentRoom.game2.visionResults[2]);

    broadcastState(currentRoom);

    if (bothSubmitted(currentRoom.game2.submitted)) {
      const bothDone = currentRoom.game2.visionResults[1] && currentRoom.game2.visionResults[2];
      if (bothDone) {
        currentRoom.game2.processing = false;
        const winner = calcGame2Winner(currentRoom);
        currentRoom.game2.winner = winner;
        if (winner) currentRoom.scores[winner]++;
        advancePhase(currentRoom, PHASES.PHASE_4_RESULT);
        schedulePhase(currentRoom, 4000, () => {
          currentRoom.phaseData.badgeWords = getBadgeWords(20);
          advancePhase(currentRoom, PHASES.PHASE_5_INTRO);
          schedulePhase(currentRoom, 3000, () => {
            advancePhase(currentRoom, PHASES.PHASE_5);
          });
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

    const allWords1 = [
      ...room.game3.words[1],
      room.game3.customWord[1],
    ].filter(Boolean);
    const allWords2 = [
      ...room.game3.words[2],
      room.game3.customWord[2],
    ].filter(Boolean);

    try {
      const text = await generateProfilerAnalysis(
        room.names[1] || 'Jucător 1',
        allWords1,
        room.names[2] || 'Jucător 2',
        allWords2,
      );
      room.game3.aiText = text;
    } catch (err) {
      console.error('OpenAI text error:', err.message);
      room.game3.aiText =
        'AI-ul a făcut o pauză de cafea. Dar voi doi sunteți clar o combinație interesantă.';
    }

    room.game3.generating = false;
    advancePhase(room, PHASES.PHASE_5_RESULT);

    schedulePhase(room, 8000, () => {
      advancePhase(room, PHASES.PHASE_6);
    });
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

httpServer.listen(PORT, () => {
  console.log(`10 June Sync Protocol running on port ${PORT}`);
});
