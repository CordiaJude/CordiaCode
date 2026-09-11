import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RepoConfig } from "./config.js";
import { NetworkError } from "./errors.js";

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

export function getClient(config: RepoConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/** Wraps a Supabase call, translating network-level failures into NetworkError
 * so commands can distinguish "offline" from "server said no". */
export async function withNetworkErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof TypeError || (err as NodeJS.ErrnoException)?.code === "ENOTFOUND") {
      throw new NetworkError(err);
    }
    throw err;
  }
}
