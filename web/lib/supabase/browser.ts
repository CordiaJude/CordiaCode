import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Used ONLY to drive the GitHub OAuth
 * handshake and manage the session cookie via the Supabase Auth SDK — never
 * to call `.from('tasks')` or any other table directly. The anon key is
 * fine to ship in the bundle for this purpose; it grants no table access on
 * its own (RLS for `tasks`/`repos` is unchanged from the CLI's shared-key
 * model, which this app never relies on).
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
