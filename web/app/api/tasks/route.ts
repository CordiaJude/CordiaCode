import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { generateTaskId, type Task } from "@/lib/types";

export async function GET() {
  await requireAllowedUser();

  const repoId = process.env.COLLAB_REPO_ID;
  if (!repoId) {
    return NextResponse.json({ error: "COLLAB_REPO_ID is not configured." }, { status: 500 });
  }

  const client = getServiceClient();
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false })
    .returns<Task[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  await requireAllowedUser();

  const repoId = process.env.COLLAB_REPO_ID;
  if (!repoId) {
    return NextResponse.json({ error: "COLLAB_REPO_ID is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const acceptanceCriteria =
    typeof body?.acceptanceCriteria === "string" ? body.acceptanceCriteria.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  // Mirrors the DB check constraint (length(trim(acceptance_criteria)) > 0) —
  // validated here too so the error is a clean 400, not a raw Postgres
  // constraint violation surfaced to the browser.
  if (!acceptanceCriteria) {
    return NextResponse.json(
      { error: "Acceptance criteria are required and cannot be empty." },
      { status: 400 }
    );
  }

  const client = getServiceClient();
  let id = generateTaskId();
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await client.from("tasks").insert({
      id,
      repo_id: repoId,
      title,
      description,
      acceptance_criteria: acceptanceCriteria,
    });
    if (!error) {
      lastError = null;
      break;
    }
    lastError = error.message;
    if (error.code === "23505") {
      id = generateTaskId();
      continue;
    }
    break;
  }

  if (lastError) {
    return NextResponse.json({ error: lastError }, { status: 502 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
