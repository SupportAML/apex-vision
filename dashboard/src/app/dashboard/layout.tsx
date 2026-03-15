import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getEntities } from "@/lib/data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const entities = getEntities();

  return (
    <SidebarProvider>
      <AppSidebar entities={entities.map((e) => ({ slug: e.slug, name: e.name }))} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-3 border-b border-border/50 bg-background/50 backdrop-blur-sm px-6 sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald glow-green" />
            <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Apex Brain</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
