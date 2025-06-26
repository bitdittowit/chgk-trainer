import { getSocket } from "./socket";
import type { Player, RoomState } from "@/types/room";

export function joinRoom(roomId: string, player: Player, onUpdate: (room: RoomState) => void) {
  const socket = getSocket();
  socket.emit("room:join", { roomId, player });
  socket.on("room:update", onUpdate);
  return () => {
    socket.emit("room:leave", { roomId, playerId: player.id });
    socket.off("room:update", onUpdate);
  };
}

export function crossLetter(roomId: string, letter: string) {
  const socket = getSocket();
  socket.emit("room:cross", { roomId, letter });
}

export function uncrossLetter(roomId: string, letter: string) {
  const socket = getSocket();
  socket.emit("room:uncross", { roomId, letter });
}

export function startTimer(roomId: string, playerId: string) {
  const socket = getSocket();
  socket.emit("room:timer:start", { roomId, playerId });
}

export function pauseTimer(roomId: string, playerId: string) {
  const socket = getSocket();
  socket.emit("room:timer:pause", { roomId, playerId });
}

export function resetTimer(roomId: string, playerId: string) {
  const socket = getSocket();
  socket.emit("room:timer:reset", { roomId, playerId });
}

export function passTurn(roomId: string, fromId: string, toId: string) {
  const socket = getSocket();
  socket.emit("room:turn:pass", { roomId, fromId, toId });
}

export function kickPlayer(roomId: string, playerId: string) {
  const socket = getSocket();
  socket.emit("room:kick", { roomId, playerId });
}

export function reorderPlayers(roomId: string, order: string[]) {
  const socket = getSocket();
  socket.emit("room:order", { roomId, order });
}

export function startTraining(roomId: string) {
  const socket = getSocket();
  socket.emit("room:start", { roomId });
}

export function restartTraining(roomId: string) {
  const socket = getSocket();
  socket.emit("room:restart", { roomId });
} 