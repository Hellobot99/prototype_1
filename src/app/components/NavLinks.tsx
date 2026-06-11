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
                    active ? "bg-gray-100 font-semibold text-black" : "text-gray-600 hover:bg-gray-50"
                  }`
                : `text-sm transition-colors ${
                    active
                      ? "text-black font-semibold border-b-2 border-black pb-0.5"
                      : "text-gray-500 hover:text-gray-800"
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
