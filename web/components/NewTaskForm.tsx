"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-input border-[0.8px] border-border bg-white px-4 py-3 text-body font-body text-ink shadow-elevation outline-none focus:border-accent";

const labelClass = "text-label-sm font-label text-muted mb-2 block";

export function NewTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const criteriaEmpty = acceptanceCriteria.trim().length === 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (criteriaEmpty) {
      setError("Acceptance criteria are required and cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          acceptanceCriteria: acceptanceCriteria.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create the task.");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Fix the claim race worker timing"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={cn(inputClass, "rounded-card min-h-24")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional context for whoever claims this."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="criteria">
          Acceptance criteria
        </label>
        <textarea
          id="criteria"
          className={cn(inputClass, "rounded-card min-h-24")}
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder="What must be true for this task to be done?"
        />
        <p className="text-label-sm font-label text-muted mt-2">Required, cannot be empty.</p>
      </div>

      {error && <p className="text-label-sm font-label text-accent-gold">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create task"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
