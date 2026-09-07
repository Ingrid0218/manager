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
  { href: "/", label: "講師履歷", icon: FileText, roles: ["admin"] },
  { href: "/course-catalog", label: "課程管理", icon: BookOpen, roles: ["admin"] },
  { href: "/scheduler", label: "講師排班", icon: CalendarDays, roles: ["admin", "staff"] },
  { href: "/feedback", label: "課程評鑑", icon: Star, roles: ["admin"] },
  { href: "/billing", label: "費用結算", icon: DollarSign, roles: ["admin"] },
  { href: "/attendance", label: "出席確認", icon: ClipboardCheck, roles: ["admin", "staff"] },
  { href: "/my-application", label: "我的申請", icon: FileText, roles: ["instructor"] },
  { href: "/my-availability", label: "空堂時間", icon: Clock, roles: ["instructor"] },
  { href: "/my-schedule", label: "我的課表", icon: CalendarDays, roles: ["instructor"] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { role, name, user } = useAuth();

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
      </SidebarFooter>
    </Sidebar>
  );
}
