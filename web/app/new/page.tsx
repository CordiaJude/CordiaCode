import { requireAllowedUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { NewTaskForm } from "@/components/NewTaskForm";

export default async function NewTaskPage() {
  const { githubLogin } = await requireAllowedUser();

  return (
    <>
      <Nav current="new" githubLogin={githubLogin} />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <p className="text-eyebrow font-label text-muted mb-2">Cordia Collaborate</p>
        <h1 className="text-h1 mb-8">New task</h1>
        <NewTaskForm />
      </main>
    </>
  );
}
