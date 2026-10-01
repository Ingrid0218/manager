"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  CalendarDays,
  Star,
  DollarSign,
  HeartPulse,
  ClipboardCheck,
  Clock,
  BookOpen,
  MessageCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, type Role } from "@/contexts/AuthContext";

const navItems: {
  href: string;
  label: string;
  icon: typeof FileText;
  roles: Role[];
}[] = [
  { href: "/resumes", label: "講師履歷", icon: FileText, roles: ["admin"] },
  { href: "/course-catalog", label: "課程管理", icon: BookOpen, roles: ["admin"] },
  { href: "/scheduler", label: "講師排班", icon: CalendarDays, roles: ["admin", "staff"] },
  { href: "/feedback", label: "課程評鑑", icon: Star, roles: ["admin"] },
  { href: "/billing", label: "費用結算", icon: DollarSign, roles: ["admin"] },
  { href: "/attendance", label: "出席確認", icon: ClipboardCheck, roles: ["admin", "staff"] },
  { href: "/messages", label: "講師對話", icon: MessageCircle, roles: ["admin"] },
  { href: "/my-application", label: "我的申請", icon: FileText, roles: ["instructor"] },
  { href: "/my-availability", label: "空堂時間", icon: Clock, roles: ["instructor"] },
  { href: "/my-schedule", label: "我的課表", icon: CalendarDays, roles: ["instructor"] },
  { href: "/my-messages", label: "與行政端對話", icon: MessageCircle, roles: ["instructor"] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { role, name, user, logout } = useAuth();

  // 登出後用整頁重新載入回首頁:
  // 1. 避免停在受保護頁面時,權限元件搶先把人導去登入頁
  // 2. 順便清掉上一個身份留在頁面裡的資料狀態,共用電腦切換身份比較乾淨
  async function handleLogout() {
    await logout();
    window.location.assign("/");
  }

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HeartPulse className="h-6 w-6" />
            </div>
            <span className="font-semibold">Puli Christian Hospital</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2 transition-colors rounded-lg hover:bg-sidebar-accent">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://picsum.photos/seed/admin/100/100" alt={name ?? "user"} data-ai-hint="person professional"/>
            <AvatarFallback>{(name ?? user?.email ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{name ?? "使用者"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
