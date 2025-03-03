"use client";

import { useTheme } from "./theme-provider";
import Image from "next/image";
import Link from "next/link";

export function Sidebar() {
  const { theme } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={theme.sidebar?.aiAvatarUrl || "/ai-avatar.png"}
                alt="AI Assistant"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              {theme.sidebar?.label || "AI Assistant"}
            </h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
              >
                Chat
              </Link>
            </li>
            <li>
              <Link
                href="/settings/theme"
                className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
              >
                Theme Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
