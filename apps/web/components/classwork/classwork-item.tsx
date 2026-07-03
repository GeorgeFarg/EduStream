"use client";

import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ClassworkItemData } from "@/components/classwork/types";
import {
  formatDueDate,
  getDaysRemaining,
  statusConfig,
} from "@/components/classwork/utils";

interface ClassworkItemProps {
  assignment: ClassworkItemData;
  onSelect: (assignmentId: string) => void;
}

export function ClassworkItem({ assignment, onSelect }: ClassworkItemProps) {
  const config = statusConfig[assignment.status];
  const StatusIcon = config.icon;
  const daysRemaining = getDaysRemaining(assignment.dueDate);

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-primary/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">{assignment.title}</h3>
            <Badge
              variant="outline"
              className={cn("gap-1.5 text-xs", config.color)}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {assignment.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{assignment.points} points</span>
            <span>Due: {formatDueDate(assignment.dueDate)}</span>
            {assignment.status === "assigned" && daysRemaining > 0 && (
              <span className="text-orange-400">
                {daysRemaining} days remaining
              </span>
            )}
            {assignment.status === "missing" && (
              <span className="text-red-400">Past due</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:flex-col md:items-end">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              assignment.status === "assigned" &&
                "border-primary bg-primary text-primary-foreground",
            )}
            onClick={() => onSelect(assignment.id)}
          >
            {assignment.status === "assigned"
              ? "Open Assignment"
              : "View Details"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
