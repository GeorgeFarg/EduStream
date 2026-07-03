"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function MobileSidebar({
  open,
  onOpenChange,
  isCollapsed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCollapsed: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[18rem] bg-sidebar text-sidebar-foreground border-sidebar-border">
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
        </SheetHeader>

        {/* Reuse the same sidebar content but hide desktop wrapper is handled by md classes */}
        <div className="h-full">
          {/* We force isCollapsed=false inside sheet so labels show */}
          <Sidebar isCollapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

