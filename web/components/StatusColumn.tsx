import { TaskCard } from "@/components/TaskCard";
import type { Task, TaskStatus } from "@/lib/types";

export function StatusColumn({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  return (
    <div>
      <p className="text-eyebrow font-label text-muted mb-4">
        {label} ({tasks.length})
      </p>
      {tasks.length === 0 ? (
        <p className="text-label-sm font-label text-muted rounded-card bg-fill/50 px-4 py-6 text-center">
          Nothing here
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
