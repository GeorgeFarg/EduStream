"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClassContext } from "@/contexts/ClassContext";
import { logoutAction } from "@/app/actions/logout";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavbarProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onMobileMenuToggle?: () => void;
}

export function Navbar({ isCollapsed, onToggleSidebar, onMobileMenuToggle }: NavbarProps) {
  const { currentUser } = useClassContext();
  const pathname = usePathname();

  // If user is on private chat page, hide the user dropdown (account menu)
  // but keep the initials bubble visible.
  const isPrivateChat = pathname?.startsWith("/private-chat") || pathname?.startsWith("/private-chat/");

  const initials = currentUser?.name
    ? currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  return (
    <header data-pathname={pathname ?? ""} className="sticky top-0 z-50 w-full bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 gap-4">
        {/* Left: Mobile Menu & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:inline-flex"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-2 ml-auto">
          {isPrivateChat ? (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              {currentUser && (
                <span className="hidden sm:inline text-sm">{currentUser.name}</span>
              )}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 ml-2"
                  aria-label="Account"
                >

                  <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  {currentUser && (
                    <span className="hidden sm:inline text-sm">{currentUser.name}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{currentUser?.email ?? "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => logoutAction()}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
