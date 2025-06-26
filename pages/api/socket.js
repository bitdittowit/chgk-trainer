import { Server } from "socket.io";
import { getRoom, addPlayer, removePlayer, updateRoom, saveRoom, loadRoom, deleteRoom } from "../../src/app/api/socket/roomState";

const timers = new Map();

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
      global.io.to(roomId).emit("room:update", getRoom(roomId));
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
  global.io.to(roomId).emit("room:update", getRoom(roomId));
}
function resetPlayerTimer(roomId, playerId) {
  pausePlayerTimer(roomId, playerId);
  const room = getRoom(roomId);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.timer = 0;
  updateRoom(roomId, { players: [...room.players] });
  global.io.to(roomId).emit("room:update", getRoom(roomId));
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end("Method Not Allowed");
    return;
  }
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
    global.io = io;
    io.on("connection", (socket) => {
      socket.on("room:join", async ({ roomId, player }) => {
        socket.join(roomId);
        await loadRoom(roomId);
        addPlayer(roomId, player);
        await saveRoom(roomId);
        io.to(roomId).emit("room:update", getRoom(roomId));
      });
      socket.on("room:leave", async ({ roomId, playerId }) => {
        removePlayer(roomId, playerId);
        socket.leave(roomId);
        if (getRoom(roomId).players.length === 0) {
          await deleteRoom(roomId);
        } else {
          await saveRoom(roomId);
        }
        io.to(roomId).emit("room:update", getRoom(roomId));
      });
      socket.on("room:cross", async ({ roomId, letter }) => {
        const room = getRoom(roomId);
        if (!room.crossed.includes(letter)) {
          updateRoom(roomId, { crossed: [...room.crossed, letter] });
          await saveRoom(roomId);
          io.to(roomId).emit("room:update", getRoom(roomId));
        }
      });
      socket.on("room:timer:start", async ({ roomId, playerId }) => {
        startPlayerTimer(roomId, playerId);
        await saveRoom(roomId);
      });
      socket.on("room:timer:pause", async ({ roomId, playerId }) => {
        pausePlayerTimer(roomId, playerId);
        await saveRoom(roomId);
      });
      socket.on("room:timer:reset", async ({ roomId, playerId }) => {
        resetPlayerTimer(roomId, playerId);
        await saveRoom(roomId);
      });
      socket.on("room:turn:pass", async ({ roomId, fromId, toId }) => {
        const room = getRoom(roomId);
        if (room.current === fromId && room.order.includes(toId)) {
          room.current = toId;
          updateRoom(roomId, { current: toId });
          await saveRoom(roomId);
          io.to(roomId).emit("room:update", getRoom(roomId));
        }
      });
      socket.on("room:kick", async ({ roomId, playerId }) => {
        removePlayer(roomId, playerId);
        await saveRoom(roomId);
        io.to(roomId).emit("room:update", getRoom(roomId));
      });
      socket.on("room:order", async ({ roomId, order }) => {
        updateRoom(roomId, { order });
        await saveRoom(roomId);
        io.to(roomId).emit("room:update", getRoom(roomId));
      });
    });
  }
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
