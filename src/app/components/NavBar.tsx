import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";

export default async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b px-4 sm:px-6 py-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="font-bold text-sm tracking-tight">Smart Scheduler</a>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <a href="/profile" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{user.email}</a>
          <form action={logout}>
            <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors">
              Logout
            </button>
          </form>
        </div>
        <MobileMenu email={user.email ?? ""} />
      </div>
    </nav>
  );
}
