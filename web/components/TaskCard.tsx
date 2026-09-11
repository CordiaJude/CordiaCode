import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Task } from "@/lib/types";

const STATUS_LABEL: Record<Task["status"], string> = {
  open: "Open",
  claimed: "Claimed",
  in_progress: "In progress",
  in_review: "In review",
  merged: "Merged",
  abandoned: "Abandoned",
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/task/${task.id}`}>
      <Card variant="filled" className="transition-opacity hover:opacity-90">
        <p className="text-eyebrow font-label text-muted mb-2">{task.id}</p>
        <h3 className="text-h3 mb-2 line-clamp-2">{task.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={task.status === "in_review" ? "positive" : "neutral"}>
            {STATUS_LABEL[task.status]}
          </Badge>
          {task.assignee && (
            <span className="text-label-sm font-label text-muted">{task.assignee}</span>
          )}
        </div>
        {task.status === "in_review" && task.pr_url && (
          <p className="text-label-sm font-label text-accent mt-3">PR open →</p>
        )}
      </Card>
    </Link>
  );
}
