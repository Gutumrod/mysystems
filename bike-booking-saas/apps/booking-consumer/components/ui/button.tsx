import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
        variant === "default" &&
          "bg-gradient-to-r from-[#69daff] to-[#00cffc] px-4 text-[#003d4d] shadow-neon hover:shadow-neon-lg hover:-translate-y-px active:translate-y-0",
        variant === "outline" &&
          "border border-white/10 bg-white/5 px-4 text-white backdrop-blur-sm hover:border-[#69daff]/30 hover:bg-white/10",
        variant === "ghost" && "px-3 hover:bg-muted",
        variant === "destructive" && "bg-[#ff7350] px-4 text-white hover:bg-[#ff7350]/85",
        size === "sm" && "min-h-9 px-3 text-xs",
        size === "icon" && "size-11 px-0",
        className
      )}
      {...props}
    />
  );
}
