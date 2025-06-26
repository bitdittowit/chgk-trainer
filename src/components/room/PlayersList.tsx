import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Player = { id: string; name: string; avatar?: string; isCurrent: boolean; timer: number; running: boolean };
type PlayerRowProps = {
  p: Player & { onPass: (id: string) => void; onKick: (id: string) => void };
  current: string;
  ref: React.Ref<HTMLDivElement>;
  style: React.CSSProperties;
};

function PlayerRow({ p, current, ref, style }: PlayerRowProps) {
  return (
    <div
      ref={ref}
      style={style}
      className={`flex items-center gap-4 p-2 rounded ${current === p.id ? "bg-accent font-bold" : ""}`}
    >
      <span className="cursor-move">☰</span>
      {p.avatar && (
        <Image
          src={p.avatar}
          alt={p.name}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
      <span className="flex-1">{p.name}</span>
      <span className="w-20 text-right font-mono">{Math.floor(p.timer / 60).toString().padStart(2, "0")}:{(p.timer % 60).toString().padStart(2, "0")}{p.running ? " ⏱️" : ""}</span>
      <Button size="sm" variant="ghost" onClick={() => p.onPass(p.id)} disabled={current === p.id}>Передать ход</Button>
      <Button size="sm" variant="destructive" onClick={() => p.onKick(p.id)}>Удалить</Button>
    </div>
  );
}

type SortablePlayerProps = {
  p: Player;
  current: string;
  onPass: (id: string) => void;
  onKick: (id: string) => void;
};

function SortablePlayer({ p, current, onPass, onKick }: SortablePlayerProps) {
  const { setNodeRef, transform, transition } = useSortable({ id: p.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <PlayerRow
      p={{ ...p, onPass, onKick }}
      current={current}
      ref={setNodeRef}
      style={style}
    />
  );
}

export function PlayersList({ players, current, onKick, onPass, onReorder }: {
  players: { id: string; name: string; isCurrent: boolean; timer: number; running: boolean }[];
  current: string;
  onKick: (id: string) => void;
  onPass: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = players.findIndex((p) => p.id === active.id);
      const newIndex = players.findIndex((p) => p.id === over?.id);
      const newOrder = arrayMove(players.map((p) => p.id), oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 w-full">
          {players.map((p) => (
            <SortablePlayer key={p.id} p={p} current={current} onPass={onPass} onKick={onKick} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 