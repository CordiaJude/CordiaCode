export class CollabError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotInitializedError extends CollabError {
  constructor() {
    super("Not a Collaborate repo. Run `collab init` first.");
  }
}

export class MissingCredentialsError extends CollabError {
  constructor() {
    super(
      "No local identity found. Run `collab init` to set your name/email."
    );
  }
}

export class NetworkError extends CollabError {
  constructor(cause?: unknown) {
    super(
      `Could not reach Supabase (offline or unreachable). ${
        cause instanceof Error ? cause.message : ""
      }`.trim()
    );
  }
}

export class TaskNotFoundError extends CollabError {
  constructor(taskId: string) {
    super(`No task with id "${taskId}".`);
  }
}

export class ClaimConflictError extends CollabError {
  constructor(taskId: string, assignee: string | null) {
    super(
      `Task "${taskId}" is already claimed${
        assignee ? ` by ${assignee}` : ""
      }.`
    );
  }
}

export class DirtyWorktreeError extends CollabError {
  constructor(path: string, detail: string) {
    super(
      `Worktree at ${path} has ${detail}. Commit/push first, or re-run with --force.`
    );
  }
}

export class NotInWorktreeError extends CollabError {
  constructor() {
    super(
      "This command must be run from inside a task worktree (no .collab/task.json found)."
    );
  }
}

export class GhCliError extends CollabError {
  constructor(detail: string) {
    super(`\`gh\` command failed: ${detail}`);
  }
}

export class GitError extends CollabError {
  constructor(detail: string) {
    super(`git command failed: ${detail}`);
  }
}
