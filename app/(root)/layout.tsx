import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";
import { SiteHeader } from "../../components/sidebar/site-header";
import { AppSidebar } from "../../components/sidebar/app-sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))] h-full overflow-hidden">
      <SidebarProvider className="flex flex-col h-full overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="pt-(--header-height) h-full overflow-hidden flex flex-col">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
