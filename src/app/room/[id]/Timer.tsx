"use client";
import { Button } from "@/components/ui/button";

export function Timer({
  running,
  value,
  onStart,
  onPause,
  onReset,
}: {
  running: boolean;
  value: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-4">
      <span className="text-2xl font-mono w-16 text-center">{minutes}:{seconds}</span>
      {running ? (
        <Button size="sm" variant="outline" onClick={onPause}>Пауза</Button>
      ) : (
        <Button size="sm" onClick={onStart}>Старт</Button>
      )}
      <Button size="sm" variant="ghost" onClick={onReset}>Сброс</Button>
    </div>
  );
} 