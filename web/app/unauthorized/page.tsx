import { EmptyState } from "@/components/EmptyState";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 sm:px-6">
      <EmptyState
        eyebrow="Access restricted"
        title="This board is invite-only"
        description="Your GitHub account isn't on the collaborator list for this project. Ask whoever's running Cordia Collaborate to add your GitHub username."
      />
    </main>
  );
}
