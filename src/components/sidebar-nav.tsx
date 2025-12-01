"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  CalendarDays,
  Star,
  DollarSign,
  HeartPulse,
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
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-headline">Care Hub</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
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
              admin@carehub.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
