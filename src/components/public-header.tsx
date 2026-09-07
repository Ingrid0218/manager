"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">{name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs"
              >
                登出
              </button>
            </>
          ) : user ? (
            // 其他角色(admin/staff/instructor)剛好逛到公開頁面時,給個回自己後台的路,不強迫登出
            <Link href="/" className="ml-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs">
              前往後台
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs"
            >
              使用者登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
