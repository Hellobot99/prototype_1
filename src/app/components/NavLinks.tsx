"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Schedule" },
  { href: "/courses", label: "Courses" },
  { href: "/reviews", label: "Reviews" },
  { href: "/career", label: "Career" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-6">
      {LINKS.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className={`text-sm transition-colors ${
            pathname === href || pathname.startsWith(href + "/")
              ? "text-black font-semibold border-b-2 border-black pb-0.5"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
