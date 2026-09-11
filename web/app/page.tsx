import { requireAllowedUser } from "@/lib/auth";

export default async function HomePage() {
  const { githubLogin } = await requireAllowedUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-eyebrow font-label text-muted mb-2">Cordia Collaborate</p>
      <h1 className="text-h1">Board coming next</h1>
      <p className="text-body text-body mt-2">Signed in as {githubLogin}.</p>
    </main>
  );
}
