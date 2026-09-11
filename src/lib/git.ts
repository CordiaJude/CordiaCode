import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { GitError } from "./errors.js";

const execFileAsync = promisify(execFile);

async function git(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.trim();
  } catch (err) {
    const message =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: unknown }).stderr)
        : String(err);
    throw new GitError(`${args.join(" ")}\n${message.trim()}`);
  }
}

export async function repoRoot(cwd = process.cwd()): Promise<string> {
  return git(["rev-parse", "--show-toplevel"], cwd);
}

export async function repoName(cwd = process.cwd()): Promise<string> {
  const root = await repoRoot(cwd);
  return root.split("/").filter(Boolean).pop() ?? "repo";
}

export async function fetchBranch(base: string, cwd: string): Promise<void> {
  await git(["fetch", "origin", base], cwd);
}

export async function createBranch(
  branch: string,
  base: string,
  cwd: string
): Promise<void> {
  await git(["branch", branch, `origin/${base}`], cwd);
}

export async function branchExists(branch: string, cwd: string): Promise<boolean> {
  try {
    await git(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], cwd);
    return true;
  } catch {
    return false;
  }
}

export async function addWorktree(
  path: string,
  branch: string,
  cwd: string
): Promise<void> {
  await git(["worktree", "add", path, branch], cwd);
}

export async function removeWorktree(path: string, cwd: string, force = false): Promise<void> {
  const args = ["worktree", "remove", path];
  if (force) args.push("--force");
  await git(args, cwd);
}

export async function pruneWorktrees(cwd: string): Promise<void> {
  await git(["worktree", "prune"], cwd);
}

export async function deleteBranch(
  branch: string,
  cwd: string,
  force = false
): Promise<void> {
  await git(["branch", force ? "-D" : "-d", branch], cwd);
}

export async function isDirty(cwd: string): Promise<boolean> {
  const out = await git(["status", "--porcelain"], cwd);
  return out.length > 0;
}

export async function remoteBranchExists(branch: string, cwd: string): Promise<boolean> {
  const out = await git(["ls-remote", "--heads", "origin", branch], cwd);
  return out.length > 0;
}

/** Commits on `branch` not present on `origin/branch` (or, if no remote
 * branch exists, not present on the base branch). */
export async function unpushedCommitCount(
  branch: string,
  base: string,
  cwd: string
): Promise<number> {
  const hasRemote = await remoteBranchExists(branch, cwd);
  const range = hasRemote ? `origin/${branch}..${branch}` : `origin/${base}..${branch}`;
  const out = await git(["rev-list", "--count", range], cwd);
  return Number(out) || 0;
}

export async function aheadCount(branch: string, base: string, cwd: string): Promise<number> {
  const out = await git(["rev-list", "--count", `origin/${base}..${branch}`], cwd);
  return Number(out) || 0;
}

export async function currentBranch(cwd: string): Promise<string> {
  return git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
}

export interface GithubRemote {
  owner: string;
  repo: string;
}

export async function parseGithubRemote(cwd: string): Promise<GithubRemote | null> {
  let url: string;
  try {
    url = await git(["remote", "get-url", "origin"], cwd);
  } catch {
    return null;
  }
  // Matches both git@github.com:owner/repo.git and https://github.com/owner/repo(.git)
  const match = url.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
