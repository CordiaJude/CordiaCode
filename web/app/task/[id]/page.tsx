import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";
import { MergeButton } from "@/components/MergeButton";
import { requireAllowedUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { getPullRequestStatus, isGenuinelyMergeable, parsePrUrl } from "@/lib/github";
import type { Task } from "@/lib/types";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const { githubLogin } = await requireAllowedUser();

  const client = getServiceClient();
  const { data: task, error: fetchError } = await client
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Task>();

  if (fetchError) {
    return (
      <>
        <Nav current="board" githubLogin={githubLogin} />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <EmptyState
            eyebrow="Something went wrong"
            title="Couldn't load this task"
            description={fetchError.message}
          />
        </main>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Nav current="board" githubLogin={githubLogin} />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <EmptyState
            eyebrow="Not found"
            title="No task with this id"
            description="It may have been abandoned and reassigned a different id, or the link is wrong."
          />
        </main>
      </>
    );
  }

  const parsedPr = task.pr_url ? parsePrUrl(task.pr_url) : null;
  let prSection: React.ReactNode = null;

  if (task.pr_url && !parsedPr) {
    prSection = (
      <Card variant="outlined">
        <p className="text-body text-body">
          This task has a PR link that couldn&apos;t be parsed: {task.pr_url}
        </p>
      </Card>
    );
  } else if (parsedPr) {
    try {
      const status = await getPullRequestStatus(parsedPr);

      if (status.merged) {
        prSection = (
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Pull request</p>
            <p className="text-body text-body mb-4">
              This PR has already merged on GitHub. Finish up locally:
            </p>
            <code className="text-label-sm font-label bg-fill block rounded-card px-3 py-2">
              collab done {task.id}
            </code>
          </Card>
        );
      } else if (status.state === "closed") {
        prSection = (
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Pull request</p>
            <p className="text-body text-body">
              This PR was closed without merging. Someone will need to reopen it or open a new
              one before this task can be submitted again.
            </p>
          </Card>
        );
      } else {
        const mergeable = isGenuinelyMergeable(status);
        prSection = (
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Pull request</p>
            <a
              href={task.pr_url!}
              className="text-body text-accent mb-2 block underline"
              target="_blank"
              rel="noreferrer"
            >
              {task.pr_url}
            </a>
            {status.checksSummary && (
              <p className="text-label-sm font-label text-muted mb-4">{status.checksSummary}</p>
            )}
            {mergeable ? (
              <MergeButton taskId={task.id} />
            ) : (
              <p className="text-label-sm font-label text-accent-gold">
                Not mergeable yet (state: {status.mergeableState ?? "unknown"}).
              </p>
            )}
          </Card>
        );
      }
    } catch {
      prSection = (
        <Card variant="outlined">
          <p className="text-body text-body">
            Couldn&apos;t reach GitHub to check this PR&apos;s status right now.
          </p>
        </Card>
      );
    }
  }

  return (
    <>
      <Nav current="board" githubLogin={githubLogin} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-eyebrow font-label text-muted mb-2">{task.id}</p>
        <h1 className="text-h1 mb-4">{task.title}</h1>
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Badge variant={task.status === "in_review" ? "positive" : "neutral"}>
            {task.status.replace("_", " ")}
          </Badge>
          {task.assignee && (
            <span className="text-label-sm font-label text-muted">{task.assignee}</span>
          )}
        </div>

        {!task.assignee && task.status === "open" && task.pr_url === null && (
          <p className="text-body text-body mb-6">
            This task was released back to open and has no PR yet.
          </p>
        )}

        <div className="mb-8 flex flex-col gap-6">
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Description</p>
            <p className="text-body text-body">{task.description || "No description."}</p>
          </Card>
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Acceptance criteria</p>
            <p className="text-body text-body whitespace-pre-wrap">
              {task.acceptance_criteria}
            </p>
          </Card>
        </div>

        {prSection}
      </main>
    </>
  );
}
