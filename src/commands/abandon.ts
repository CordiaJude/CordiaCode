import type { Command } from "commander";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { loadCredentials, loadRepoConfig } from "../lib/config.js";
import { getClient, type Task } from "../lib/supabase.js";
import { deleteBranch, isDirty, removeWorktree, repoRoot, unpushedCommitCount } from "../lib/git.js";
import { worktreePath } from "../lib/slug.js";
import { CollabError, TaskNotFoundError } from "../lib/errors.js";

export function registerAbandon(program: Command): void {
  program
    .command("abandon <taskId>")
    .description("Release a claim and remove its worktree/branch")
    .option("--force", "Abandon even with uncommitted or unpushed changes")
    .action(async (taskId: string, opts: { force?: boolean }) => {
      const cwd = await repoRoot();
      const config = loadRepoConfig(cwd);
      const creds = loadCredentials();
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

      const parentDir = dirname(cwd);
      const targetPath = worktreePath(parentDir, config.repoName, taskId);
      const worktreeExists = existsSync(targetPath);

      if (worktreeExists && !opts.force && task.branch_name) {
        const dirty = await isDirty(targetPath);
        const unpushed = await unpushedCommitCount(task.branch_name, config.baseBranchCache, targetPath).catch(
          () => 0
        );
        if (dirty || unpushed > 0) {
          throw new CollabError(
            `Worktree at ${targetPath} has ${dirty ? "uncommitted" : "unpushed"} changes. ` +
              `Re-run with --force to discard them.`
          );
        }
      }

      // Re-check current assignee right before mutating — someone else may
      // have reclaimed this task since we fetched it above.
      if (task.assignee !== creds.identity) {
        throw new CollabError(
          `Task ${taskId} is currently assigned to ${task.assignee ?? "no one"}, not you. Refusing to abandon.`
        );
      }

      let dbUpdated = false;
      if (worktreeExists) {
        await removeWorktree(targetPath, cwd, Boolean(opts.force));
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
        .update({ status: "open", assignee: null, branch_name: null, pr_url: null })
        .eq("id", taskId)
        .eq("assignee", creds.identity);
      if (!updateErr) dbUpdated = true;

      if (!dbUpdated) {
        console.warn(
          `Local cleanup done, but could not update Supabase (offline or the task changed hands). ` +
            `Re-run \`collab abandon ${taskId}\` once connectivity is back if it still shows as claimed by you.`
        );
        return;
      }

      console.log(`Task ${taskId} released back to open.`);
    });
}
