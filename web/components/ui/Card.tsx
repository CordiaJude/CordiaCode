import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant: "filled" | "outlined";
}

// Two variants only. filled = interactive content (dashboards, board cards).
// outlined = static content (detail pages, read-only info blocks). Never mix
// variants within one section/page.
export function Card({ variant, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        variant === "filled" && "bg-fill p-[22px]",
        variant === "outlined" && "border-[0.8px] border-border bg-white p-7",
        className
      )}
      {...props}
    />
  );
}
