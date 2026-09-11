import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { parsePrUrl, squashMergeAndDeleteBranch } from "@/lib/github";
import type { Task } from "@/lib/types";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  await requireAllowedUser();

  const client = getServiceClient();
  const { data: task, error } = await client
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Task>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  if (!task.pr_url) {
    return NextResponse.json({ error: "This task has no PR to merge." }, { status: 400 });
  }

  const parsed = parsePrUrl(task.pr_url);
  if (!parsed) {
    return NextResponse.json({ error: "Could not parse the PR URL." }, { status: 500 });
  }

  try {
    await squashMergeAndDeleteBranch(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Merge failed." },
      { status: 409 }
    );
  }

  // Deliberately no Supabase write here — status stays in_review until
  // `collab done` runs locally. See Phase 2 plan.
  return NextResponse.json({ merged: true, taskId: task.id });
}
