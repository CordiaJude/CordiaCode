import type { Command } from "commander";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadCredentials, tryLoadRepoConfig } from "../lib/config.js";
import { tryReadWorktreeTaskMeta } from "../lib/task.js";
import {
  aheadCount,
  isDirty,
  remoteBranchExists,
  repoRoot,
} from "../lib/git.js";
import { CollabError } from "../lib/errors.js";

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("Show my local worktrees and their state (works offline)")
    .action(async () => {
      const cwd = await repoRoot();
      const config = tryLoadRepoConfig(cwd);
      if (!config) {
        throw new CollabError("Not a Collaborate repo. Run `collab init` first.");
      }

      let identity: string | null = null;
      try {
        identity = loadCredentials().identity;
      } catch {
        // status should still work without credentials configured
      }

      const parentDir = dirname(cwd);
      const prefix = `${config.repoName}-`;
      const candidates = readdirSync(parentDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name.startsWith(prefix))
        .map((d) => join(parentDir, d.name));

      if (candidates.length === 0) {
        console.log("No local task worktrees found.");
        return;
      }

      const rows = [];
      for (const path of candidates) {
        const meta = tryReadWorktreeTaskMeta(path);
        if (!meta) continue;
        const dirty = await isDirty(path).catch(() => null);
        const ahead = await aheadCount(meta.branch, meta.base, path).catch(() => null);
        const hasRemote = await remoteBranchExists(meta.branch, path).catch(() => null);
        rows.push({
          task: meta.taskId,
          branch: meta.branch,
          path,
          state: dirty === null ? "unknown" : dirty ? "dirty" : "clean",
          aheadOfBase: ahead ?? "unknown",
          remoteBranch: hasRemote === null ? "unknown" : hasRemote ? "yes" : "no",
        });
      }

      if (identity) {
        console.log(`Local worktrees for ${identity}:`);
      }
      console.table(rows);
    });
}
