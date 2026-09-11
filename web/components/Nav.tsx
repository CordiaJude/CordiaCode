import Link from "next/link";
import { cn } from "@/lib/cn";
import { requireAllowedUser } from "@/lib/auth";

export async function Nav({ current }: { current: "board" | "new" }) {
  const { githubLogin } = await requireAllowedUser();
  const initials = githubLogin.slice(0, 2).toUpperCase();

  return (
    <nav className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-heading text-ink text-lg">
          Cordia
        </Link>
        <Link
          href="/"
          className={cn(
            "font-label text-label-sm",
            current === "board" ? "text-ink" : "text-muted"
          )}
        >
          Board
        </Link>
        <Link
          href="/new"
          className={cn(
            "font-label text-label-sm",
            current === "new" ? "text-ink" : "text-muted"
          )}
        >
          New task
        </Link>
      </div>
      <div className="bg-fill text-ink flex h-8 w-8 items-center justify-center rounded-pill text-xs font-semibold">
        {initials}
      </div>
    </nav>
  );
}
