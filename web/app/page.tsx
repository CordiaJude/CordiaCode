import { requireAllowedUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Board } from "@/components/Board";

export default async function HomePage() {
  await requireAllowedUser();

  return (
    <>
      <Nav current="board" />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-eyebrow font-label text-muted mb-2">Cordia Collaborate</p>
        <h1 className="text-h1 mb-8">Board</h1>
        <Board />
      </main>
    </>
  );
}
