import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";

export default async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#134e3b] px-4 sm:px-6 py-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="font-bold text-sm tracking-tight text-white">Course Planner</a>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <LanguageSelector />
          <ThemeToggle />
          <a href="/profile" className="text-xs text-white/50 hover:text-white/80 transition-colors">{user.email}</a>
          <form action={logout}>
            <button type="submit" className="text-xs text-red-300 hover:text-red-200 transition-colors">
              Logout
            </button>
          </form>
        </div>
        <MobileMenu email={user.email ?? ""} />
      </div>
    </nav>
  );
}
