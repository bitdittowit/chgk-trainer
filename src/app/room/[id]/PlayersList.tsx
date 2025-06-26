import { Button } from "@/components/ui/button";

export function PlayersList({ players, onKick, onPass }: {
  players: { id: string; name: string; isCurrent: boolean }[];
  onKick: (id: string) => void;
  onPass: (id: string) => void;
}) {
  // TODO: drag-and-drop
  return (
    <div className="flex flex-col gap-2 w-full">
      {players.map((p) => (
        <div key={p.id} className={`flex items-center gap-4 p-2 rounded ${p.isCurrent ? "bg-accent" : ""}`}>
          <span className="flex-1">{p.name}</span>
          <Button size="sm" variant="ghost" onClick={() => onPass(p.id)} disabled={p.isCurrent}>Передать ход</Button>
          <Button size="sm" variant="destructive" onClick={() => onKick(p.id)}>Удалить</Button>
        </div>
      ))}
    </div>
  );
} 