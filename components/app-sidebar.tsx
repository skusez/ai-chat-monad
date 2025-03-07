"use client";

import type { User } from "next-auth";
import { useRouter } from "next/navigation";

import { PlusIcon, SettingsIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { themeConfig } from "@/lib/theme-config";

export function AppSidebar({
  user,
  isAdminPage,
}: {
  user: User | undefined;
  isAdminPage: boolean;
}) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                {isAdminPage ? "Questions" : themeConfig.sidebar.label}
              </span>
            </Link>
            {!isAdminPage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push("/");
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            )}
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} isAdminPage={isAdminPage} />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <>
            {user.isAdmin && isAdminPage ? (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/");
                  }}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  User Dashboard
                </Button>
              </div>
            ) : (
              <div className="mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/admin");
                      }}
                    >
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Manage Briefs</TooltipContent>
                </Tooltip>
              </div>
            )}
            <SidebarUserNav user={user} />
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
