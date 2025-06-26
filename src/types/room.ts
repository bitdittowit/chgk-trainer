export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isCurrent: boolean;
  timer: number;
  running: boolean;
}

export interface RoomState {
  id: string;
  players: Player[];
  crossed: string[];
  order: string[]; // массив id игроков в порядке хода
  current: string; // id текущего игрока
} 