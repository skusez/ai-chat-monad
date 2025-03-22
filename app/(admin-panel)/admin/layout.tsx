import type { ReactNode } from "react";
import { auth } from "../../(auth)/auth";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { redirect, unauthorized } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";
  if (!session) {
    redirect("/login");
  }

  if (!session.user?.isAdmin) {
    unauthorized();
  }
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} isAdminPage={true} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
