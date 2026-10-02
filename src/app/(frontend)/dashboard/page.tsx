"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/join");
    }
  }, [isPending, session, router]);

  if (isPending)
    return <p className="mt-8 text-center text-muted-foreground">Loading...</p>;
  if (!session?.user)
    return (
      <p className="mt-8 text-center text-muted-foreground">Redirecting...</p>
    );

  const { user } = session;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center space-y-4 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name || "User"}!</p>
      <p>Email: {user.email}</p>
      <button
        onClick={() => signOut()}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/80"
      >
        Sign Out
      </button>
    </main>
  );
}
