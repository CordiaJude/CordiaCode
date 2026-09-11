import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

// The only two button styles in the app. Never reimplement inline.
export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "font-label text-label rounded-pill px-[22px] py-3 uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-accent text-white shadow-elevation",
        variant === "secondary" && "bg-fill text-ink",
        className
      )}
      {...props}
    />
  );
}
