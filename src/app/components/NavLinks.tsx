"use client";

import { usePathname } from "next/navigation";

export const LINKS = [
  { href: "/dashboard", label: "Schedule" },
  { href: "/courses", label: "Courses" },
  { href: "/reviews", label: "Reviews" },
  { href: "/career", label: "Career" },
];

export default function NavLinks({
  vertical = false,
  onNavigate,
}: {
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className={vertical ? "flex flex-col gap-1" : "flex items-center gap-6"}>
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <a
            key={href}
            href={href}
            onClick={onNavigate}
            className={
              vertical
                ? `px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[#bef2dc] font-semibold text-[#134e3b] dark:bg-[#134e3b] dark:text-[#bef2dc]"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`
                : `text-sm transition-colors ${
                    active
                      ? "text-white font-semibold border-b-2 border-[#bef2dc] pb-0.5"
                      : "text-white/60 hover:text-white"
                  }`
            }
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}
