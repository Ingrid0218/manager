"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  CalendarDays,
  Star,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
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

const navItems = [
  { href: "/", label: "講師履歷", icon: FileText },
  { href: "/scheduler", label: "講師排班", icon: CalendarDays },
  { href: "/feedback", label: "課程評鑑", icon: Star },
  { href: "/billing", label: "費用結算", icon: DollarSign },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
          <Image src="https://www.pch.org.tw/web/images/logo.png" alt="Puli Christian Hospital Logo" width={200} height={50} />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
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
            <AvatarImage src="https://picsum.photos/seed/admin/100/100" alt="Admin" data-ai-hint="person professional"/>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">管理者</p>
            <p className="text-xs text-muted-foreground truncate">
              admin@christian.puli.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
