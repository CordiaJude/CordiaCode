"use client";

import useSWR from "swr";
import { StatusColumn } from "@/components/StatusColumn";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "in_review", label: "In review" },
  { status: "merged", label: "Merged" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Board() {
  const { data, error, isLoading } = useSWR<{ tasks: Task[]; error?: string }>(
    "/api/tasks",
    fetcher,
    { refreshInterval: 7000 }
  );

  if (isLoading) {
    return <p className="text-body text-muted">Loading board…</p>;
  }

  if (error || data?.error) {
    return (
      <EmptyState
        eyebrow="Something went wrong"
        title="Couldn't load the board"
        description={data?.error ?? "The board couldn't be reached. It'll retry automatically."}
      />
    );
  }

  const tasks = data?.tasks ?? [];

  if (tasks.length === 0) {
    return (
      <EmptyState
        eyebrow="No tasks yet"
        title="This board is empty"
        description="Create the first task to get started, or claim one from the CLI once it exists."
        action={
          <a href="/new">
            <Button variant="primary">New task</Button>
          </a>
        }
      />
    );
  }

  // Claimed sits visually with in_progress (both mean "someone owns this"),
  // and abandoned tasks are back to open in practice, so they fold into the
  // Open column rather than getting a fifth, mostly-empty column.
  const grouped: Record<TaskStatus, Task[]> = {
    open: [],
    claimed: [],
    in_progress: [],
    in_review: [],
    merged: [],
    abandoned: [],
  };
  for (const task of tasks) {
    grouped[task.status].push(task);
  }
  grouped.in_progress = [...grouped.claimed, ...grouped.in_progress];
  grouped.open = [...grouped.open, ...grouped.abandoned];

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => (
        <StatusColumn
          key={col.status}
          status={col.status}
          label={col.label}
          tasks={grouped[col.status]}
        />
      ))}
    </div>
  );
}
