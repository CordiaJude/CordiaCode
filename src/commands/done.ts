import type { Command } from "commander";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { loadRepoConfig } from "../lib/config.js";
import { getClient, type Task } from "../lib/supabase.js";
import { getPullRequestState } from "../lib/gh.js";
import { deleteBranch, isDirty, repoRoot } from "../lib/git.js";
import { removeWorktree } from "../lib/git.js";
import { worktreePath } from "../lib/slug.js";
import { CollabError, TaskNotFoundError } from "../lib/errors.js";

export function registerDone(program: Command): void {
  program
    .command("done <taskId>")
    .description("Clean up a task's worktree/branch after its PR has merged")
    .option("--force", "Remove the worktree even if it has uncommitted changes")
    .action(async (taskId: string, opts: { force?: boolean }) => {
      const cwd = await repoRoot();
      const config = loadRepoConfig(cwd);
      const client = getClient(config);

      const { data: task, error } = await client
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .maybeSingle<Task>();
      if (error) {
        throw new CollabError(`Could not reach Supabase: ${error.message}`);
      }
      if (!task) {
        throw new TaskNotFoundError(taskId);
      }
      if (!task.pr_url) {
        throw new CollabError(`Task ${taskId} has no PR recorded. Run \`collab submit\` first.`);
      }

      const prState = await getPullRequestState(task.pr_url, cwd);
      if (prState.state !== "MERGED") {
        throw new CollabError(
          `PR for ${taskId} is not merged yet (state: ${prState.state}). Refusing to clean up.`
        );
      }

      const parentDir = dirname(cwd);
      const targetPath = worktreePath(parentDir, config.repoName, taskId);

      if (existsSync(targetPath)) {
        if ((await isDirty(targetPath)) && !opts.force) {
          throw new CollabError(
            `Worktree at ${targetPath} has uncommitted changes even though the PR merged. ` +
              `Re-run with --force to discard them, or commit/inspect them first.`
          );
        }
        await removeWorktree(targetPath, cwd, Boolean(opts.force));
      } else {
        console.log(`Worktree at ${targetPath} already gone, continuing cleanup.`);
      }

      if (task.branch_name) {
        try {
          await deleteBranch(task.branch_name, cwd, true);
        } catch {
          console.warn(`Could not delete local branch ${task.branch_name} (may already be gone).`);
        }
      }

      const { error: updateErr } = await client
        .from("tasks")
        .update({ status: "merged" })
        .eq("id", taskId);
      if (updateErr) {
        throw new CollabError(`Local cleanup done, but could not update Supabase: ${updateErr.message}`);
      }

      console.log(`Task ${taskId} marked merged and cleaned up locally.`);
    });
}
