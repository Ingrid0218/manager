import type { Role } from "@/contexts/AuthContext";

// 每個角色登入後該去的頁面;"/" 已經是公開首頁,不再是 admin 的後台
export const ROLE_HOME: Record<Role, string> = {
  admin: "/resumes",
  staff: "/attendance",
  instructor: "/my-application",
  family: "/my-elders",
};
