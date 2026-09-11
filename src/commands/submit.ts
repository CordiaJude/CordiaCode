import type { Command } from "commander";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tryLoadRepoConfig } from "../lib/config.js";
import { getClient, type Task } from "../lib/supabase.js";
import { readWorktreeTaskMeta } from "../lib/task.js";
import { ensureGhAuthenticated, createPullRequest } from "../lib/gh.js";
import { unpushedCommitCount, aheadCount } from "../lib/git.js";
import { CollabError, TaskNotFoundError } from "../lib/errors.js";

const execFileAsync = promisify(execFile);

export function registerSubmit(program: Command): void {
  program
    .command("submit")
    .description("Push the branch and open a PR for the current task worktree")
    .action(async () => {
      const cwd = process.cwd();
      const meta = readWorktreeTaskMeta(cwd);
      const config = tryLoadRepoConfig(cwd);
      if (!config) {
        throw new CollabError(
          "Could not find .collab/config.json in this worktree. Run this from inside a worktree created by `collab claim`."
        );
      }

      const ahead = await aheadCount(meta.branch, meta.base, cwd);
      if (ahead === 0) {
        throw new CollabError(
          `No commits ahead of ${meta.base} yet — nothing to submit.`
        );
      }

      await ensureGhAuthenticated(cwd);

      try {
        await execFileAsync("git", ["push", "-u", "origin", meta.branch], { cwd });
      } catch (err) {
        const detail = err && typeof err === "object" && "stderr" in err ? String((err as { stderr: unknown }).stderr) : String(err);
        throw new CollabError(`git push failed: ${detail.trim()}`);
      }

      const client = getClient(config);
      const { data: task, error } = await client
        .from("tasks")
        .select("*")
        .eq("id", meta.taskId)
        .maybeSingle<Task>();
      if (error) {
        throw new CollabError(`Could not reach Supabase: ${error.message}`);
      }
      if (!task) {
        throw new TaskNotFoundError(meta.taskId);
      }

      const body = `${task.description}\n\n## Acceptance Criteria\n\n${task.acceptance_criteria}`;
      const prUrl = await createPullRequest({
        base: meta.base,
        title: task.title,
        body,
        cwd,
      });

      const { error: updateErr } = await client
        .from("tasks")
        .update({ status: "in_review", pr_url: prUrl })
        .eq("id", meta.taskId);

      if (updateErr) {
        console.warn(
          `PR opened at ${prUrl}, but could not update task status in Supabase ` +
            `(${updateErr.message}). Re-run \`collab submit\` once connectivity is back.`
        );
        return;
      }

      console.log(`PR opened: ${prUrl}`);
      console.log(`Task ${meta.taskId} marked in_review.`);
    });
}
