// Mirrors src/lib/supabase.ts (the CLI's types) and src/lib/slug.ts
// (generateTaskId/slugify) — that file is the source of truth for the
// schema. Copied rather than imported: web/ is a separate package from the
// CLI (see Phase 2 plan), so this is duplicated on purpose, not an oversight.
import { customAlphabet } from "nanoid";

export type TaskStatus =
  | "open"
  | "claimed"
  | "in_progress"
  | "in_review"
  | "merged"
  | "abandoned";

export interface Task {
  id: string;
  repo_id: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  assignee: string | null;
  status: TaskStatus;
  branch_name: string | null;
  pr_url: string | null;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
}

export interface Repo {
  id: string;
  name: string;
  github_owner: string;
  github_repo: string;
  base_branch: string;
  created_at: string;
}

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const generateTaskId = customAlphabet(ALPHABET, 7);
