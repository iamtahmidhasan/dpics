"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-1 items-center justify-center bg-background text-foreground">
      <div className="flex gap-4 py-28">
        <button
          onClick={() => router.push("/sign-up")}
          className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign Up
        </button>
        <button
          onClick={() => router.push("/sign-in")}
          className="rounded-md border border-border px-6 py-2 font-medium text-foreground hover:bg-muted"
        >
          Sign In
        </button>
      </div>
    </main>
  );
}
