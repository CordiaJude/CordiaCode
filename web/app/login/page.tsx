"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const supabase = getBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center px-4 sm:px-6">
      <p className="text-eyebrow font-label text-muted mb-2">Cordia Collaborate</p>
      <h1 className="text-h1 mb-3">Sign in</h1>
      <p className="text-body text-body mb-8">
        This board is restricted to invited collaborators. Sign in with the GitHub
        account you were added with.
      </p>
      <Button onClick={signIn} disabled={pending}>
        {pending ? "Redirecting…" : "Sign in with GitHub"}
      </Button>
    </main>
  );
}
