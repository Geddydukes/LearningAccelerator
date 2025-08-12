import React from "react";
import { cn } from "./utils";

interface ProgressProps {
  value?: number;
  className?: string;
}

export function Progress({ value = 0, className }: ProgressProps) {
  return (
    <div
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
    >
      <div
        className="bg-primary h-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
} 