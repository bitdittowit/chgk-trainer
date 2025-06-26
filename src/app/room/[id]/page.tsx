"use client";
import React from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlphabetTable, Timer, PlayersList } from "@/components/room";
import { joinRoom, crossLetter, uncrossLetter, startTimer, pauseTimer, resetTimer, passTurn, kickPlayer, reorderPlayers, startTraining, restartTraining } from "@/lib/roomClient";
import type { Player, RoomState } from "@/types/room";
import { Toast } from "@/components/ui/toast";
import { getSocket } from "@/lib/socket";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  useEffect(() => {
    if (!session || !session.user) return;
    const player: Player = {
      id: (session.user as { id?: string }).id || "",
      name: session.user.name ?? "Игрок",
      avatar: session.user.image ?? undefined,
      isCurrent: false,
      timer: 0,
      running: false,
    };
    const cleanup = joinRoom(id, player, (newRoom) => {
      if (room && newRoom) {
        if (room.players.length > newRoom.players.length) setToast({ open: true, message: "Игрок удалён" });
        if (room.players.length < newRoom.players.length) setToast({ open: true, message: `В комнату вошёл: ${newRoom.players.find((p: { id: string }) => !room.players.some((rp: { id: string }) => rp.id === p.id))?.name || "Новый игрок"}` });
        if (room.current !== newRoom.current) setToast({ open: true, message: `Ход передан игроку: ${newRoom.players.find(p => p.id === newRoom.current)?.name || ""}` });
        for (const p of newRoom.players) {
          const prev = room.players.find(rp => rp.id === p.id);
          if (prev && prev.running && !p.running && prev.timer !== 0 && p.timer === prev.timer) setToast({ open: true, message: `${p.name} поставил таймер на паузу` });
          if (prev && prev.timer !== 0 && p.timer === 0) setToast({ open: true, message: `${p.name} сбросил таймер` });
        }
      }
      setRoom(newRoom);
    });
    // Подписка на room:toast
    const socket = getSocket();
    const onToast = (msg: string) => setToast({ open: true, message: msg });
    socket.on("room:toast", onToast);
    return () => {
      cleanup();
      socket.off("room:toast", onToast);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  if (status === "loading") return <div>Загрузка...</div>;
  if (!session) return null;

  function handleCross(letter: string) {
    if (room?.crossed.includes(letter)) {
      uncrossLetter(id, letter);
    } else {
      crossLetter(id, letter);
    }
  }

  const currentPlayer = room?.players.find((p) => p.id === (session?.user as { id?: string })?.id);

  function handleStart() {
    if (currentPlayer && room?.current === currentPlayer.id) startTimer(id, currentPlayer.id);
  }
  function handlePause() {
    if (currentPlayer) pauseTimer(id, currentPlayer.id);
  }
  function handleReset() {
    if (currentPlayer) resetTimer(id, currentPlayer.id);
  }
  function handlePass(toId: string) {
    if (currentPlayer) passTurn(id, currentPlayer.id, toId);
  }
  function handleKick(pid: string) {
    kickPlayer(id, pid);
  }
  function handleReorder(order: string[]) {
    reorderPlayers(id, order);
  }

  const anyTimerRunning = room?.players.some((p) => p.running);
  const allLettersCrossed = room && room.crossed.length === 33; // 33 буквы русского алфавита

  function handleStartTraining() {
    startTraining(id);
  }
  function handleRestartTraining() {
    restartTraining(id);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-2 sm:px-0 bg-gradient-to-br from-background to-muted">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">Комната: {id}</h2>
      <div className="w-full max-w-xl flex flex-col gap-8 items-center">
        <AlphabetTable crossed={room?.crossed || []} onClick={handleCross} />
        <div className="w-full flex flex-col items-center gap-2">
          <Timer
            running={currentPlayer?.running || false}
            value={currentPlayer?.timer || 0}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            canStart={room?.current === currentPlayer?.id}
          />
          <span className="text-xs text-muted-foreground">Ваш персональный таймер. Запускайте только на своём ходу!</span>
        </div>
        <div className="w-full">
          <PlayersList
            players={room?.players || []}
            current={room?.current || ""}
            onKick={handleKick}
            onPass={handlePass}
            onReorder={handleReorder}
          />
          <span className="text-xs text-muted-foreground block mt-2">Перетаскивайте игроков для изменения очередности. <br />Текущий игрок выделен цветом.</span>
        </div>
        {!anyTimerRunning && !allLettersCrossed && (
          <Button className="mt-4" onClick={handleStartTraining}>
            Начать тренировку
          </Button>
        )}
        {allLettersCrossed && (
          <Button className="mt-4" variant="secondary" onClick={handleRestartTraining}>
            Начать заново
          </Button>
        )}
      </div>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>Выйти</Button>
      <Toast message={toast.message} open={toast.open} onClose={() => setToast({ ...toast, open: false })} />
    </main>
  );
} 