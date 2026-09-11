import { Octokit } from "@octokit/rest";

export function getOctokit(): Octokit {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("Missing GITHUB_PAT env var.");
  }
  return new Octokit({ auth: token });
}

export interface ParsedPrUrl {
  owner: string;
  repo: string;
  number: number;
}

export function parsePrUrl(prUrl: string): ParsedPrUrl | null {
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: Number(match[3]) };
}

export interface PrStatus {
  state: "open" | "closed";
  merged: boolean;
  mergeableState: string | null; // GitHub's mergeable_state: clean, unstable, dirty, blocked, etc.
  mergeable: boolean | null;
  checksSummary: string | null; // e.g. "3/3 checks passing"
  headRef: string;
}

/**
 * Genuinely mergeable means GitHub reports a mergeable_state of 'clean' or
 * 'unstable' (checks still pending/non-required-failed but no merge
 * conflict and no blocking review requirement) — never 'blocked', 'dirty',
 * or 'behind'. This is deliberately stricter than "PR is open" so the
 * merge button can't be used to force a merge over red CI or an unresolved
 * conflict.
 */
export function isGenuinelyMergeable(status: PrStatus): boolean {
  return (
    !status.merged &&
    status.state === "open" &&
    status.mergeable === true &&
    (status.mergeableState === "clean" || status.mergeableState === "unstable")
  );
}

export async function getPullRequestStatus(parsed: ParsedPrUrl): Promise<PrStatus> {
  const octokit = getOctokit();
  const { data: pr } = await octokit.pulls.get({
    owner: parsed.owner,
    repo: parsed.repo,
    pull_number: parsed.number,
  });

  const { data: checks } = await octokit.checks.listForRef({
    owner: parsed.owner,
    repo: parsed.repo,
    ref: pr.head.sha,
  });

  const total = checks.check_runs.length;
  const passing = checks.check_runs.filter((c) => c.conclusion === "success").length;
  const checksSummary = total > 0 ? `${passing}/${total} checks passing` : null;

  return {
    state: pr.state as "open" | "closed",
    merged: pr.merged,
    mergeableState: pr.mergeable_state ?? null,
    mergeable: pr.mergeable,
    checksSummary,
    headRef: pr.head.ref,
  };
}

/**
 * Squash-merges and deletes the remote branch. Never touches Supabase —
 * the caller is responsible for leaving `status` alone, per the Phase 2
 * decision that only `collab done` transitions a task to 'merged'.
 */
export async function squashMergeAndDeleteBranch(parsed: ParsedPrUrl): Promise<void> {
  const octokit = getOctokit();

  // Re-fetch fresh right before merging — never trust a status computed
  // even a few seconds earlier for an action this consequential.
  const status = await getPullRequestStatus(parsed);
  if (!isGenuinelyMergeable(status)) {
    throw new Error(
      `PR is not in a mergeable state (mergeable_state: ${status.mergeableState ?? "unknown"}).`
    );
  }

  await octokit.pulls.merge({
    owner: parsed.owner,
    repo: parsed.repo,
    pull_number: parsed.number,
    merge_method: "squash",
  });

  try {
    await octokit.git.deleteRef({
      owner: parsed.owner,
      repo: parsed.repo,
      ref: `heads/${status.headRef}`,
    });
  } catch {
    // Branch deletion failing (already gone, protected, etc.) shouldn't
    // undo or fail the merge that already succeeded.
  }
}
