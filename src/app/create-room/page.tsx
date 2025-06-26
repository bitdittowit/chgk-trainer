"use client";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";

export default function CreateRoomPage() {
  const router = useRouter();

  function handleCreate() {
    const id = nanoid(8);
    router.push(`/room/${id}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h2 className="text-2xl font-bold">Создать новую комнату</h2>
      <Button onClick={handleCreate}>Создать комнату</Button>
    </main>
  );
} 