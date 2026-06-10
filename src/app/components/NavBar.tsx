import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import NavLinks from "./NavLinks";

export default async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <a href="/dashboard" className="font-bold text-sm tracking-tight">Smart Scheduler</a>
        <NavLinks />
      </div>
      <div className="flex items-center gap-4">
        <a href="/profile" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{user.email}</a>
        <form action={logout}>
          <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
