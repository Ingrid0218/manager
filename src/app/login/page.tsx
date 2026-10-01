"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_HOME } from "@/lib/role-home";

export default function LoginPage() {
  const { login, user, role, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 登入成功(或本來就已登入)且角色資料讀到之後,直接導去該角色的頁面
  useEffect(() => {
    if (loading || !user) return;
    if (role) {
      router.replace(ROLE_HOME[role]);
    } else {
      setError("這個帳號尚未設定角色,請聯絡管理者");
    }
  }, [user, role, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      // 導向交給上面的 useEffect,等角色資料讀到再決定去哪一頁
    } catch (err) {
      setError("帳號或密碼錯誤,請再確認一次");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-white text-lg">
            ♥
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Puli Christian Hospital</p>
            <p className="text-xs text-gray-400 leading-tight">樂齡課程系統登入</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-white font-medium py-2 text-sm transition disabled:opacity-60"
          >
            {submitting ? "登入中..." : "登入"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          <Link href="/" className="hover:underline">回首頁</Link>
          {" ｜ "}
          還沒有帳號?{" "}
          <Link href="/register" className="text-amber-600 hover:underline">
            點此註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
