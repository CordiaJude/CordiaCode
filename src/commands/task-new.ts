import type { Command } from "commander";
import prompts from "prompts";
import { loadRepoConfig } from "../lib/config.js";
import { getClient } from "../lib/supabase.js";
import { generateTaskId } from "../lib/slug.js";
import { CollabError } from "../lib/errors.js";

export function registerTaskNew(program: Command): void {
  const task = program.command("task").description("Manage tasks");

  task
    .command("new")
    .description("Create a new task in the shared registry")
    .option("-t, --title <title>", "Task title")
    .option("-d, --description <description>", "Task description", "")
    .option(
      "-c, --criteria <criteria>",
      "Acceptance criteria (required, non-empty)"
    )
    .action(async (opts) => {
      const config = loadRepoConfig();
      const client = getClient(config);

      let title = opts.title as string | undefined;
      let description = (opts.description as string) ?? "";
      let criteria = opts.criteria as string | undefined;

      if (!title || !criteria) {
        const answers = await prompts([
          {
            type: title ? null : "text",
            name: "title",
            message: "Title",
          },
          {
            type: description ? null : "text",
            name: "description",
            message: "Description (optional)",
          },
          {
            type: criteria ? null : "text",
            name: "criteria",
            message: "Acceptance criteria (required)",
          },
        ]);
        title = title ?? answers.title;
        description = description || answers.description || "";
        criteria = criteria ?? answers.criteria;
      }

      if (!title || !title.trim()) {
        throw new CollabError("Title is required.");
      }
      if (!criteria || !criteria.trim()) {
        throw new CollabError(
          "Acceptance criteria are required and cannot be empty — they're what Phase 2's " +
            "AI precheck will validate against."
        );
      }

      let id = generateTaskId();
      let insertError: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await client.from("tasks").insert({
          id,
          repo_id: config.repoId,
          title: title.trim(),
          description,
          acceptance_criteria: criteria.trim(),
        });
        if (!error) {
          insertError = null;
          break;
        }
        insertError = error.message;
        if (error.code === "23505") {
          // primary key collision on the generated id — regenerate and retry once
          id = generateTaskId();
          continue;
        }
        break;
      }

      if (insertError) {
        throw new CollabError(`Could not create task: ${insertError}`);
      }

      console.log(`Created task ${id}: ${title.trim()}`);
    });
}
