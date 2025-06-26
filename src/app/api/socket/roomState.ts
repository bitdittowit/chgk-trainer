import type { RoomState, Player } from "@/types/room";
import { Redis } from "@upstash/redis";

const rooms = new Map<string, RoomState>();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function getRoom(id: string): RoomState {
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      players: [],
      crossed: [],
      order: [],
      current: "",
    });
  }
  return rooms.get(id)!;
}

export function updateRoom(id: string, patch: Partial<RoomState>) {
  const room = getRoom(id);
  rooms.set(id, { ...room, ...patch });
}

export function addPlayer(roomId: string, player: Player) {
  const room = getRoom(roomId);
  if (!room.players.find((p) => p.id === player.id)) {
    room.players.push(player);
    room.order.push(player.id);
    if (!room.current) room.current = player.id;
  }
}

export function removePlayer(roomId: string, playerId: string) {
  const room = getRoom(roomId);
  room.players = room.players.filter((p) => p.id !== playerId);
  room.order = room.order.filter((id) => id !== playerId);
  if (room.current === playerId) {
    room.current = room.order[0] || "";
  }
}

export async function saveRoom(id: string) {
  const room = getRoom(id);
  await redis.set(`room:${id}`, JSON.stringify(room));
}

export async function loadRoom(id: string) {
  const data = await redis.get<string>(`room:${id}`);
  if (data) {
    const parsed = JSON.parse(data) as RoomState;
    rooms.set(id, parsed);
    return parsed;
  }
  return null;
}

export async function deleteRoom(id: string) {
  await redis.del(`room:${id}`);
  rooms.delete(id);
} 