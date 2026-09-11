#!/usr/bin/env node
import { Command } from "commander";
import { CollabError } from "../src/lib/errors.js";
import { registerInit } from "../src/commands/init.js";
import { registerTaskNew } from "../src/commands/task-new.js";
import { registerList } from "../src/commands/list.js";
import { registerClaim } from "../src/commands/claim.js";
import { registerStatus } from "../src/commands/status.js";
import { registerSubmit } from "../src/commands/submit.js";
import { registerDone } from "../src/commands/done.js";
import { registerAbandon } from "../src/commands/abandon.js";

const program = new Command("collab").description(
  "Manage git worktrees per task against a shared Supabase task registry"
);

registerInit(program);
registerTaskNew(program);
registerList(program);
registerClaim(program);
registerStatus(program);
registerSubmit(program);
registerDone(program);
registerAbandon(program);

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof CollabError) {
      console.error(`collab: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

main();
