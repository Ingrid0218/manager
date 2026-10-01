"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_HOME } from "@/lib/role-home";

const publicNavItems = [
  { href: "/courses", label: "課程簡介" },
  { href: "/course-calendar", label: "課程行事曆" },
  { href: "/reviews", label: "課程評鑑" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, name, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-white text-sm">
            ♥
          </div>
          <span className="text-sm font-bold text-gray-900">Puli Christian Hospital 樂齡課程</span>
        </Link>
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

          {role === "family" ? (
            <>
              <Link
                href="/my-elders"
                className={`px-3 py-1.5 rounded-lg transition ${
                  pathname === "/my-elders"
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                我的長者
              </Link>
              <Link
                href="/my-reviews"
                className={`px-3 py-1.5 rounded-lg transition ${
                  pathname === "/my-reviews"
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                課程紀錄
              </Link>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">{name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs"
              >
                登出
              </button>
            </>
          ) : user ? (
            <Link
              href={role ? ROLE_HOME[role] : "/login"}
              className="ml-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 text-xs"
            >
              前往後台
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium"
            >
              登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
