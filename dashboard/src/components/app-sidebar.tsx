"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  Zap,
  Briefcase,
  Scale,
  Scissors,
  PiggyBank,
  Wrench,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Markets", href: "/dashboard/markets", icon: TrendingUp },
  { title: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
  { title: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Metrics", href: "/dashboard/metrics", icon: BarChart3 },
  { title: "Team", href: "/dashboard/team", icon: Users },
];

const entityIcons: Record<string, typeof Briefcase> = {
  nlc: Scale,
  apexmedlaw: Briefcase,
  "a2z-equity": PiggyBank,
  "club-haus": Scissors,
  "titan-renovations": Wrench,
};

interface AppSidebarProps {
  entities: { slug: string; name: string }[];
}

export function AppSidebar({ entities }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-cyan">
            <Zap className="h-4.5 w-4.5 text-black" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald border-2 border-sidebar glow-green" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Apex Brain</p>
            <p className="text-[11px] text-muted-foreground tracking-wide">COMMAND CENTER</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 px-3">
            Entities
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {entities.map((entity) => {
                const Icon = entityIcons[entity.slug] || Briefcase;
                return (
                  <SidebarMenuItem key={entity.slug}>
                    <SidebarMenuButton
                      isActive={pathname === `/dashboard/entity/${entity.slug}`}
                      render={<Link href={`/dashboard/entity/${entity.slug}`} />}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{entity.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/settings" />}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
