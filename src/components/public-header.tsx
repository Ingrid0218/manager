"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const publicNavItems = [
  { href: "/courses", label: "課程簡介" },
  { href: "/course-calendar", label: "課程行事曆" },
  { href: "/reviews", label: "課程評鑑" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-white text-sm">
            ♥
          </div>
          <span className="text-sm font-bold text-gray-900">Puli Christian Hospital 樂齡課程</span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg transition ${
                pathname === item.href
                  ? "bg-amber-100 text-amber-800 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs"
          >
            使用者登入
          </Link>
        </nav>
      </div>
    </header>
  );
}
