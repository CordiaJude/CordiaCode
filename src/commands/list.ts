import type { Command } from "commander";
import { loadCredentials, loadRepoConfig } from "../lib/config.js";
import { getClient, type Task, type TaskStatus } from "../lib/supabase.js";

export function registerList(program: Command): void {
  program
    .command("list")
    .description("List tasks in the shared registry")
    .option("--mine", "Only show tasks assigned to me")
    .option("--status <status>", "Filter by status")
    .option("--repo <name>", "Filter by repo name")
    .action(async (opts) => {
      const config = loadRepoConfig();
      const client = getClient(config);

      // Filtering on an embedded resource column (repos.name) requires an
      // inner join (`repos!inner`) — a left join silently ignores the filter.
      const embed = opts.repo ? "repos!inner(name)" : "repos(name)";
      let query = client.from("tasks").select(`*, ${embed}`).order("created_at", { ascending: false });

      if (opts.mine) {
        const creds = loadCredentials();
        query = query.eq("assignee", creds.identity);
      }
      if (opts.status) {
        query = query.eq("status", opts.status as TaskStatus);
      }
      if (opts.repo) {
        query = query.eq("repos.name", opts.repo);
      } else {
        query = query.eq("repo_id", config.repoId);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`collab: could not reach Supabase: ${error.message}`);
        process.exitCode = 1;
        return;
      }

      const tasks = (data ?? []) as unknown as (Task & { repos: { name: string } | null })[];
      if (tasks.length === 0) {
        console.log("No tasks found.");
        return;
      }

      const rows = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignee: t.assignee ?? "-",
        branch: t.branch_name ?? "-",
        repo: t.repos?.name ?? "-",
      }));
      console.table(rows);
    });
}
