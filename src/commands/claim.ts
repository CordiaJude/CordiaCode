import type { Command } from "commander";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadCredentials, loadRepoConfig, saveRepoConfig } from "../lib/config.js";
import { getClient, type Task } from "../lib/supabase.js";
import { claimTaskInDb, isMyRecoverableClaim } from "../lib/claim.js";
import {
  addWorktree,
  branchExists,
  createBranch,
  ensureCollabDirExcluded,
  fetchBranch,
  repoRoot,
} from "../lib/git.js";
import { branchName, worktreePath } from "../lib/slug.js";
import { writeWorktreeFiles } from "../lib/task.js";
import { CollabError, TaskNotFoundError } from "../lib/errors.js";

export function registerClaim(program: Command): void {
  program
    .command("claim <taskId>")
    .description("Claim a task, creating its branch and worktree")
    .action(async (taskId: string) => {
      const cwd = await repoRoot();
      const config = loadRepoConfig(cwd);
      const creds = loadCredentials();
      const client = getClient(config);

      const { data: existing, error: fetchErr } = await client
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .maybeSingle<Task>();
      if (fetchErr) {
        throw new CollabError(`Could not reach Supabase: ${fetchErr.message}`);
      }
      if (!existing) {
        throw new TaskNotFoundError(taskId);
      }

      let task: Task;
      if (isMyRecoverableClaim(existing, creds.identity)) {
        console.log(`Resuming existing claim on "${taskId}" (recovering local setup).`);
        task = existing;
      } else {
        task = await claimTaskInDb(client, taskId, creds.identity);
      }

      // Base branch: Supabase is authoritative, refresh the local cache.
      const { data: repoRow } = await client
        .from("repos")
        .select("base_branch")
        .eq("id", config.repoId)
        .single<{ base_branch: string }>();
      const base = repoRow?.base_branch ?? config.baseBranchCache;

      const branch = task.branch_name ?? branchName(task.id, task.title);
      const parentDir = dirname(cwd);
      const targetPath = worktreePath(parentDir, config.repoName, task.id);

      await fetchBranch(base, cwd);

      if (!(await branchExists(branch, cwd))) {
        await createBranch(branch, base, cwd);
      }

      if (!existsSync(targetPath)) {
        await addWorktree(targetPath, branch, cwd);
      } else if (!existsSync(join(targetPath, ".git"))) {
        throw new CollabError(
          `${targetPath} already exists and isn't a git worktree. Remove it manually and re-run.`
        );
      }

      // Without this, .collab/ shows up as untracked in every worktree's
      // `git status`, which makes `collab done`/`abandon` see a permanently
      // "dirty" worktree and refuse cleanup unless --force is passed every
      // time. This is local machine state, so it goes in the repo's
      // (uncommitted) exclude file, never the target repo's own .gitignore.
      await ensureCollabDirExcluded(targetPath);

      writeWorktreeFiles(targetPath, task, { taskId: task.id, branch, base });
      // Each worktree carries its own copy of config.json (not the anon key
      // alone — the whole config) so submit/done/abandon can run from inside
      // it without any reference back to the main checkout.
      saveRepoConfig({ ...config, baseBranchCache: base }, targetPath);

      if (task.status !== "in_progress" || task.branch_name !== branch) {
        await client
          .from("tasks")
          .update({ status: "in_progress", branch_name: branch })
          .eq("id", task.id);
      }

      console.log(`\nClaimed "${task.title}" (${task.id}).`);
      console.log(`Worktree ready at: ${targetPath}`);
      console.log(`\n  cd ${targetPath}\n`);
    });
}
