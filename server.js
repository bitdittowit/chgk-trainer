import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Redis } from '@upstash/redis';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// --- Room state logic (in-memory + Upstash Redis) ---
const rooms = new Map();
const timers = new Map();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function getRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      players: [],
      crossed: [],
      order: [],
      current: '',
    });
  }
  return rooms.get(id);
}
function updateRoom(id, patch) {
  const room = getRoom(id);
  Object.assign(room, patch);
}
function addPlayer(roomId, player) {
  const room = getRoom(roomId);
  const existing = room.players.find((p) => p.id === player.id);
  if (!existing) {
    room.players.push({ ...player, online: true, socketId: player.socketId });
    room.order.push(player.id);
    if (!room.current) room.current = player.id;
  } else {
    existing.online = true;
    if (player.socketId) existing.socketId = player.socketId;
  }
}
function removePlayer(roomId, playerId) {
  const room = getRoom(roomId);
  room.players = room.players.filter((p) => p.id !== playerId);
  room.order = room.order.filter((id) => id !== playerId);
  if (room.current === playerId) {
    room.current = room.order[0] || '';
  }
}
async function saveRoom(id) {
  await redis.set(`room:${id}`, JSON.stringify(getRoom(id)));
}
async function loadRoom(id) {
  const data = await redis.get(`room:${id}`);
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      rooms.set(id, parsed);
      return parsed;
    } catch (e) {
      console.error('Invalid JSON in room:', id, data, e);
      await redis.del(`room:${id}`);
      return null;
    }
  }
  if (data) {
    await redis.del(`room:${id}`);
  }
  return null;
}
async function deleteRoom(id) {
  await redis.del(`room:${id}`);
  rooms.delete(id);
}

function startPlayerTimer(roomId, playerId) {
  const room = getRoom(roomId);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.running = true;
  if (timers.has(playerId)) clearInterval(timers.get(playerId));
  timers.set(
    playerId,
    setInterval(() => {
      player.timer += 1;
      updateRoom(roomId, { players: [...room.players] });
      io.to(roomId).emit('room:update', getRoom(roomId));
    }, 1000)
  );
}
function pausePlayerTimer(roomId, playerId) {
  const room = getRoom(roomId);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.running = false;
  if (timers.has(playerId)) {
    clearInterval(timers.get(playerId));
    timers.delete(playerId);
  }
  updateRoom(roomId, { players: [...room.players] });
  io.to(roomId).emit('room:update', getRoom(roomId));
}
function resetPlayerTimer(roomId, playerId) {
  pausePlayerTimer(roomId, playerId);
  const room = getRoom(roomId);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.timer = 0;
  updateRoom(roomId, { players: [...room.players] });
  io.to(roomId).emit('room:update', getRoom(roomId));
}

// --- Socket.io events ---
io.on('connection', (socket) => {
  socket.on('room:join', async ({ roomId, player }) => {
    socket.join(roomId);
    await loadRoom(roomId);
    addPlayer(roomId, { ...player, socketId: socket.id });
    await saveRoom(roomId);
    io.to(roomId).emit('room:update', getRoom(roomId));
  });
  socket.on('room:leave', async ({ roomId, playerId }) => {
    removePlayer(roomId, playerId);
    socket.leave(roomId);
    if (getRoom(roomId).players.length === 0) {
      await deleteRoom(roomId);
    } else {
      await saveRoom(roomId);
    }
    io.to(roomId).emit('room:update', getRoom(roomId));
  });
  socket.on('room:cross', async ({ roomId, letter }) => {
    const room = getRoom(roomId);
    if (!room.crossed.includes(letter)) {
      updateRoom(roomId, { crossed: [...room.crossed, letter] });
      const currentIdx = room.order.indexOf(room.current);
      const nextIdx = (currentIdx + 1) % room.order.length;
      const nextId = room.order[nextIdx];
      pausePlayerTimer(roomId, room.current);
      updateRoom(roomId, { current: nextId });
      startPlayerTimer(roomId, nextId);
      await saveRoom(roomId);
      io.to(roomId).emit('room:update', getRoom(roomId));
    }
  });
  socket.on('room:start', async ({ roomId }) => {
    const room = getRoom(roomId);
    if (room.current) {
      startPlayerTimer(roomId, room.current);
      await saveRoom(roomId);
      const player = room.players.find(p => p.id === room.current);
      if (player) {
        io.to(roomId).emit('room:toast', `${player.name} начал тренировку`);
      }
      io.to(roomId).emit('room:update', getRoom(roomId));
    }
  });
  socket.on('room:timer:pause', async ({ roomId, playerId }) => {
    pausePlayerTimer(roomId, playerId);
    await saveRoom(roomId);
    const room = getRoom(roomId);
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      io.to(roomId).emit('room:toast', `${player.name} поставил таймер на паузу`);
    }
  });
  socket.on('room:timer:reset', async ({ roomId, playerId }) => {
    resetPlayerTimer(roomId, playerId);
    await saveRoom(roomId);
  });
  socket.on('room:turn:pass', async ({ roomId, fromId, toId }) => {
    const room = getRoom(roomId);
    if (room.current === fromId && room.order.includes(toId)) {
      room.current = toId;
      updateRoom(roomId, { current: toId });
      await saveRoom(roomId);
      io.to(roomId).emit('room:update', getRoom(roomId));
    }
  });
  socket.on('room:kick', async ({ roomId, playerId }) => {
    removePlayer(roomId, playerId);
    await saveRoom(roomId);
    io.to(roomId).emit('room:update', getRoom(roomId));
  });
  socket.on('room:order', async ({ roomId, order }) => {
    updateRoom(roomId, { order });
    await saveRoom(roomId);
    io.to(roomId).emit('room:update', getRoom(roomId));
  });
  socket.on('room:uncross', async ({ roomId, letter }) => {
    const room = getRoom(roomId);
    if (room.crossed.includes(letter)) {
      updateRoom(roomId, { crossed: room.crossed.filter((l) => l !== letter) });
      await saveRoom(roomId);
      io.to(roomId).emit('room:update', getRoom(roomId));
    }
  });
  socket.on('disconnect', () => {
    // Помечаем всех игроков с этим socketId как offline, но не трогаем таймеры
    for (const [roomId, room] of rooms.entries()) {
      let changed = false;
      for (const p of room.players) {
        if (p.socketId === socket.id) {
          p.online = false;
          changed = true;
        }
      }
      if (changed) {
        updateRoom(roomId, { players: [...room.players] });
        io.to(roomId).emit('room:update', getRoom(roomId));
        saveRoom(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('Socket.io server running on port', PORT);
}); 