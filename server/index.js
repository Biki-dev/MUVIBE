/**
 * server/index.js
 * ─────────────────────────────────────────────────────────────────
 * Socket.IO server for MUVIBE Blitz Battle private rooms.
 *
 * One room is one Socket.IO room, keyed by a short code people read
 * aloud. Nothing is written to a database: a bout lasts 60 to 90
 * seconds, so the room lives in memory and disappears when the last
 * player leaves.
 *
 * Events in  (client -> server)
 *   room:create  { player }                 -> ack { ok, code, state }
 *   room:join    { code, player }           -> ack { ok, state } | { ok:false, error }
 *   room:leave   {}
 *   room:start   { mode }                   host only
 *   score:update { score, finished }
 *
 * Events out (server -> client)
 *   room:state   full room state, after every membership change
 *   room:started { mode, startedAt }        everyone counts from startedAt
 *   score:state  { players }                live scores during a bout
 *
 * Run:  cd server && npm install && npm start
 * ─────────────────────────────────────────────────────────────────
 */
import http from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT) || 3001;

/** Unambiguous alphabet: no O/0, no I/1, because codes get read aloud. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

/** code -> { code, hostId, mode, startedAt, players: Map<socketId, player> } */
const rooms = new Map();

function makeCode() {
  let code;
  do {
    code = Array.from(
      { length: CODE_LENGTH },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function normaliseCode(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== CODE_LENGTH) return null;
  for (const ch of cleaned) if (!CODE_ALPHABET.includes(ch)) return null;
  return cleaned;
}

/** Trusts nothing the client sends: every field is clamped or defaulted. */
function sanitisePlayer(raw, socketId) {
  const p = raw && typeof raw === 'object' ? raw : {};
  return {
    id: socketId,
    name: String(p.name ?? 'Athlete').slice(0, 40),
    elo: Number.isFinite(p.elo) ? Math.max(100, Math.min(4000, Math.round(p.elo))) : 1500,
    score: 0,
    finished: false,
    joinedAt: Date.now(),
  };
}

function publicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    mode: room.mode,
    startedAt: room.startedAt,
    players: [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt),
  };
}

function broadcastState(io, room) {
  io.to(room.code).emit('room:state', publicState(room));
}

/** Removes a socket from whatever room it is in, tidying up after it. */
function leaveRoom(io, socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.data.roomCode = null;
  socket.leave(code);
  if (!room) return;

  room.players.delete(socket.id);

  if (room.players.size === 0) {
    rooms.delete(code);
    console.log(`[room ${code}] empty, closed`);
    return;
  }

  // The host leaving must not strand the room: the next player by join
  // time inherits it, matching what the lobby already shows.
  if (room.hostId === socket.id) {
    const next = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0];
    room.hostId = next.id;
    console.log(`[room ${code}] host left, ${next.name} now hosts`);
  }
  broadcastState(io, room);
}

const app = express();
app.use(cors());

// A plain health route, so "is the server up?" needs no socket client.
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    players: [...rooms.values()].reduce((n, r) => n + r.players.size, 0),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  // The app runs from a phone, a browser and a LAN IP during
  // development, so the origin is never fixed.
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[socket] ${socket.id} connected`);
  socket.data.roomCode = null;

  socket.on('room:create', (payload, ack) => {
    leaveRoom(io, socket);
    const code = makeCode();
    const player = sanitisePlayer(payload?.player, socket.id);
    const room = {
      code,
      hostId: socket.id,
      mode: null,
      startedAt: null,
      players: new Map([[socket.id, player]]),
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    console.log(`[room ${code}] created by ${player.name}`);
    ack?.({ ok: true, code, state: publicState(room) });
  });

  socket.on('room:join', (payload, ack) => {
    const code = normaliseCode(payload?.code);
    if (!code) return ack?.({ ok: false, error: 'That room code does not look right.' });

    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'No room with that code. Check it and try again.' });
    if (room.startedAt) return ack?.({ ok: false, error: 'That bout has already started.' });
    if (room.players.size >= 8) return ack?.({ ok: false, error: 'That room is full.' });

    leaveRoom(io, socket);
    const player = sanitisePlayer(payload?.player, socket.id);
    room.players.set(socket.id, player);
    socket.join(code);
    socket.data.roomCode = code;
    console.log(`[room ${code}] ${player.name} joined (${room.players.size} in room)`);

    ack?.({ ok: true, state: publicState(room) });
    broadcastState(io, room);
  });

  socket.on('room:start', (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.startedAt) return;
    if (room.players.size < 2) return;

    room.mode = payload?.mode === 'walk' ? 'walk' : 'run';
    // A second of lead-in so the slower phone still starts on time.
    room.startedAt = Date.now() + 1000;
    for (const p of room.players.values()) {
      p.score = 0;
      p.finished = false;
    }
    console.log(`[room ${room.code}] bout started, mode ${room.mode}`);
    io.to(room.code).emit('room:started', { mode: room.mode, startedAt: room.startedAt });
    broadcastState(io, room);
  });

  socket.on('score:update', (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    const score = Number(payload?.score);
    // Scores only ever climb during a bout, so a lower number is a
    // stale packet arriving late rather than a real update.
    if (Number.isFinite(score) && score >= player.score) {
      player.score = Math.max(0, Math.round(score));
    }
    if (payload?.finished === true) player.finished = true;

    io.to(room.code).emit('score:state', { players: publicState(room).players });
  });

  socket.on('room:leave', () => leaveRoom(io, socket));

  socket.on('disconnect', (reason) => {
    console.log(`[socket] ${socket.id} disconnected (${reason})`);
    leaveRoom(io, socket);
  });
});

server.listen(PORT, () => {
  console.log(`MUVIBE Blitz socket server on http://localhost:${PORT}`);
  console.log(`Health check:  http://localhost:${PORT}/health`);
});
