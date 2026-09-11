import { redirect } from "next/navigation";
import { getSessionClient } from "./supabase/server";

function allowedLogins(): string[] {
  return (process.env.ALLOWED_GITHUB_LOGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function githubLoginFromUser(user: {
  user_metadata?: Record<string, unknown>;
}): string | null {
  const meta = user.user_metadata ?? {};
  const login = (meta.user_name ?? meta.preferred_username ?? meta.login) as
    | string
    | undefined;
  return login ? login.toLowerCase() : null;
}

export function isAllowedLogin(login: string | null): boolean {
  if (!login) return false;
  return allowedLogins().includes(login.toLowerCase());
}

/**
 * Server Component / Route Handler guard. Middleware already redirects
 * unauthenticated or non-allowlisted requests before they get here, but
 * this is the actual enforcement point — never trust middleware alone for
 * something this consequential.
 */
export async function requireAllowedUser() {
  const supabase = getSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const login = githubLoginFromUser(user);
  if (!isAllowedLogin(login)) {
    redirect("/unauthorized");
  }

  return { user, githubLogin: login as string };
}
