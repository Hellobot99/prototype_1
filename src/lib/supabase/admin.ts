import { createClient } from "@supabase/supabase-js";

// Server-only client with the service role key — required for admin
// operations like deleting a user from auth.users. Never import this
// from client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
