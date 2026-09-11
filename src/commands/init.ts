import type { Command } from "commander";
import prompts from "prompts";
import { saveRepoConfig, saveCredentials, tryLoadRepoConfig } from "../lib/config.js";
import { getClient } from "../lib/supabase.js";
import { parseGithubRemote, repoName, repoRoot } from "../lib/git.js";
import { CollabError } from "../lib/errors.js";
import type { Repo } from "../lib/supabase.js";

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Link the current repo to a Collaborate project")
    .action(async () => {
      const cwd = await repoRoot();
      const existing = tryLoadRepoConfig(cwd);
      if (existing) {
        console.log(`Already initialized (repo id ${existing.repoId}). Nothing to do.`);
        return;
      }

      const remote = await parseGithubRemote(cwd);
      if (!remote) {
        throw new CollabError(
          "Could not determine GitHub owner/repo from `git remote get-url origin`. " +
            "Make sure this repo has a GitHub remote configured."
        );
      }

      const answers = await prompts([
        {
          type: "text",
          name: "supabaseUrl",
          message: "Supabase project URL",
          validate: (v: string) => (v.startsWith("http") ? true : "Must be a URL"),
        },
        {
          type: "password",
          name: "supabaseAnonKey",
          message: "Supabase anon key",
        },
        {
          type: "text",
          name: "baseBranch",
          message: "Base branch for PRs",
          initial: "main",
        },
        {
          type: "text",
          name: "identity",
          message: "Your identity (name or email, used as task assignee)",
        },
      ]);

      if (!answers.supabaseUrl || !answers.supabaseAnonKey || !answers.identity) {
        throw new CollabError("Init cancelled: all fields are required.");
      }

      const client = getClient({
        supabaseUrl: answers.supabaseUrl,
        supabaseAnonKey: answers.supabaseAnonKey,
        repoId: "",
        repoName: "",
        githubOwner: remote.owner,
        githubRepo: remote.repo,
        baseBranchCache: answers.baseBranch,
      });

      const name = await repoName(cwd);

      const { data: existingRepo, error: fetchErr } = await client
        .from("repos")
        .select("*")
        .eq("github_owner", remote.owner)
        .eq("github_repo", remote.repo)
        .maybeSingle();
      if (fetchErr) {
        throw new CollabError(`Could not reach Supabase: ${fetchErr.message}`);
      }

      let repo: Repo;
      if (existingRepo) {
        repo = existingRepo as Repo;
        console.log(`Linked to existing repo record "${repo.name}" (${repo.id}).`);
      } else {
        const { data: inserted, error: insertErr } = await client
          .from("repos")
          .insert({
            name,
            github_owner: remote.owner,
            github_repo: remote.repo,
            base_branch: answers.baseBranch,
          })
          .select()
          .single();
        if (insertErr || !inserted) {
          throw new CollabError(`Could not create repo record: ${insertErr?.message}`);
        }
        repo = inserted as Repo;
        console.log(`Created repo record "${repo.name}" (${repo.id}).`);
      }

      saveRepoConfig(
        {
          supabaseUrl: answers.supabaseUrl,
          supabaseAnonKey: answers.supabaseAnonKey,
          repoId: repo.id,
          repoName: name,
          githubOwner: remote.owner,
          githubRepo: remote.repo,
          baseBranchCache: repo.base_branch,
        },
        cwd
      );
      saveCredentials({ identity: answers.identity });

      console.log(`\nInitialized. Config written to .collab/config.json (gitignored).`);
      console.log(`Identity "${answers.identity}" written to ~/.collab/credentials.json.`);
    });
}
