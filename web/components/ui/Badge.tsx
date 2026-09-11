import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "positive" | "premium" | "neutral";
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "font-label text-label-sm inline-block rounded-pill px-3 py-[5px] uppercase",
        variant === "positive" && "bg-accent/12 text-accent",
        variant === "premium" && "bg-accent-gold/12 text-accent-gold",
        variant === "neutral" && "bg-fill text-muted",
        className
      )}
      {...props}
    />
  );
}
