"use client";

import { useState } from "react";
import NavLinks from "./NavLinks";
import { logout } from "@/app/login/actions";
import ThemeToggle from "./ThemeToggle";

export default function MobileMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center gap-3">
      <ThemeToggle />
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Toggle menu"
        className="p-2 -mr-2 text-white/70 hover:text-white text-xl leading-none"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-lg z-50 p-3 space-y-1">
            <NavLinks vertical onNavigate={() => setOpen(false)} />
            <div className="border-t dark:border-gray-700 mt-2 pt-2 flex items-center justify-between px-3">
              <a
                href="/profile"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {email}
              </a>
              <form action={logout}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
