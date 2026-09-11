import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./supabase.js";
import { ClaimConflictError, TaskNotFoundError } from "./errors.js";

/**
 * Atomically claims a task: only succeeds if the task is currently 'open'.
 * Race-safety comes from Postgres row locking on the UPDATE, not from any
 * check-then-act logic here — see the schema notes for why.
 *
 * supabase-js gives no rowCount, so `.select()` is required to get rows back
 * at all; zero rows means someone else's UPDATE committed first.
 */
export async function claimTaskInDb(
  client: SupabaseClient,
  taskId: string,
  assignee: string
): Promise<Task> {
  const { data, error } = await client
    .from("tasks")
    .update({ assignee, status: "claimed", claimed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "open")
    .select()
    .returns<Task[]>();

  if (error) {
    throw new Error(`Could not claim task: ${error.message}`);
  }

  if (data.length === 0) {
    const { data: current } = await client
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle<Task>();
    if (!current) {
      throw new TaskNotFoundError(taskId);
    }
    if (current.status !== "open") {
      throw new ClaimConflictError(taskId, current.assignee);
    }
    // Status is 'open' again (lost the race but the winner has since
    // released it) — extremely unlikely window, treat as a conflict too
    // rather than silently retrying and masking the race.
    throw new ClaimConflictError(taskId, null);
  }

  return data[0];
}

/** True if `task` is already claimed by `assignee` and in a recoverable
 * local state (claim succeeded in the DB but local git setup may not have
 * finished) — both 'claimed' and 'in_progress' count, since local failure
 * can happen on either side of that transition. */
export function isMyRecoverableClaim(task: Task, assignee: string): boolean {
  return (
    task.assignee === assignee &&
    (task.status === "claimed" || task.status === "in_progress")
  );
}
