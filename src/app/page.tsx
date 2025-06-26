"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [room, setRoom] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">CHGK Alphabet Trainer</h1>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/create-room")}>Создать комнату</Button>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (room) router.push(`/room/${room}`);
          }}
          className="flex gap-2"
        >
          <input
            className="border rounded px-2 py-1"
            placeholder="Код комнаты"
            value={room}
            onChange={e => setRoom(e.target.value)}
          />
          <Button type="submit">Войти</Button>
        </form>
      </div>
    </main>
  );
}
