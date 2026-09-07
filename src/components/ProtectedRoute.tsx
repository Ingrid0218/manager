"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

const roleHomePage: Record<Role, string> = {
  admin: "/",
  staff: "/attendance",
  instructor: "/my-application",
  family: "/my-elders",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      router.push(role ? roleHomePage[role] : "/login");
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
