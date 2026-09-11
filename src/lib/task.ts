import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "./supabase.js";
import { NotInWorktreeError } from "./errors.js";

export interface WorktreeTaskMeta {
  taskId: string;
  branch: string;
  base: string;
}

function taskJsonPath(worktreeDir: string): string {
  return join(worktreeDir, ".collab", "task.json");
}

export function writeWorktreeFiles(worktreeDir: string, task: Task, meta: WorktreeTaskMeta): void {
  const collabDir = join(worktreeDir, ".collab");
  writeFileSync(
    join(worktreeDir, "TASK.md"),
    `# ${task.title}\n\n## Description\n\n${task.description || "_(none)_"}\n\n## Acceptance Criteria\n\n${task.acceptance_criteria}\n`,
    "utf8"
  );
  mkdirSync(collabDir, { recursive: true });
  writeFileSync(taskJsonPath(worktreeDir), JSON.stringify(meta, null, 2) + "\n", "utf8");
}

export function readWorktreeTaskMeta(worktreeDir = process.cwd()): WorktreeTaskMeta {
  const path = taskJsonPath(worktreeDir);
  if (!existsSync(path)) {
    throw new NotInWorktreeError();
  }
  return JSON.parse(readFileSync(path, "utf8")) as WorktreeTaskMeta;
}

export function tryReadWorktreeTaskMeta(worktreeDir: string): WorktreeTaskMeta | null {
  try {
    return readWorktreeTaskMeta(worktreeDir);
  } catch {
    return null;
  }
}
