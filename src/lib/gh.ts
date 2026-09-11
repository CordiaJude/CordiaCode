import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { GhCliError } from "./errors.js";

const execFileAsync = promisify(execFile);

async function gh(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("gh", args, { cwd });
    return stdout.trim();
  } catch (err) {
    const message =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: unknown }).stderr)
        : String(err);
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new GhCliError(
        "`gh` is not installed. Install the GitHub CLI: https://cli.github.com"
      );
    }
    throw new GhCliError(message.trim());
  }
}

export async function ensureGhAuthenticated(cwd: string): Promise<void> {
  try {
    await gh(["auth", "status"], cwd);
  } catch {
    throw new GhCliError("Not authenticated. Run `gh auth login` first.");
  }
}

export async function createPullRequest(opts: {
  base: string;
  title: string;
  body: string;
  cwd: string;
}): Promise<string> {
  try {
    const url = await gh(
      ["pr", "create", "--base", opts.base, "--title", opts.title, "--body", opts.body],
      opts.cwd
    );
    // gh prints the PR URL as (one of) the last line(s) of stdout.
    const lastLine = url.split("\n").filter(Boolean).pop() ?? url;
    return lastLine.trim();
  } catch (err) {
    if (err instanceof GhCliError && /already exists/i.test(err.message)) {
      return existingPullRequestUrl(opts.cwd);
    }
    throw err;
  }
}

export async function existingPullRequestUrl(cwd: string): Promise<string> {
  return gh(["pr", "view", "--json", "url", "--jq", ".url"], cwd);
}

export interface PrState {
  state: "OPEN" | "CLOSED" | "MERGED";
  mergedAt: string | null;
}

export async function getPullRequestState(prUrl: string, cwd: string): Promise<PrState> {
  const out = await gh(["pr", "view", prUrl, "--json", "state,mergedAt"], cwd);
  const parsed = JSON.parse(out) as { state: PrState["state"]; mergedAt: string | null };
  return parsed;
}
