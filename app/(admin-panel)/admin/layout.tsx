import { ReactNode } from "react";
import { auth } from "../../(auth)/auth";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} isAdminPage={true} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
