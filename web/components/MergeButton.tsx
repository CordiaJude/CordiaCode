"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MergeButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);

  async function handleMerge() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/merge`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Merge failed.");
        setPending(false);
        return;
      }
      setMerged(true);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  if (merged) {
    return (
      <div className="rounded-card bg-fill p-4">
        <p className="text-body text-body mb-2">
          Merged. Finish up locally by running:
        </p>
        <code className="text-label-sm font-label bg-white rounded-card block px-3 py-2">
          collab done {taskId}
        </code>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleMerge} disabled={pending}>
        {pending ? "Merging…" : "Merge (squash)"}
      </Button>
      {error && <p className="text-label-sm font-label text-accent-gold mt-3">{error}</p>}
    </div>
  );
}
