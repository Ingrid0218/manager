"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[]; // 不傳代表只要登入就能看,不限角色
}

/**
 * 用法:
 * <ProtectedRoute>只要登入就能看</ProtectedRoute>
 * <ProtectedRoute allowedRoles={["admin"]}>只有 admin 能看</ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // 還在判斷登入狀態,先不要做任何跳轉
    if (!user) {
      router.push("/login");
      return;
    }
    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      router.push("/"); // 登入了但角色不符,導回首頁
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        載入中...
      </div>
    );
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
