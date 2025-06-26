"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User2Icon } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Загрузка...</div>;
  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-card shadow-md">
        <User2Icon className="w-16 h-16 text-muted-foreground mb-2" />
        <div className="text-lg font-semibold">Вы не авторизованы</div>
        <div className="text-muted-foreground mb-2 text-center">Чтобы просмотреть профиль, войдите в аккаунт через Google или Яндекс.</div>
        <Button onClick={() => signIn()}>
          Войти
        </Button>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h2 className="text-2xl font-bold">Профиль</h2>
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-card shadow-md">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || "avatar"}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div className="text-lg font-semibold">{session.user?.name}</div>
        <div className="text-muted-foreground">{session.user?.email}</div>
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
          Выйти из аккаунта
        </Button>
      </div>
    </main>
  );
} 