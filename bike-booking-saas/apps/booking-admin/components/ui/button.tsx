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
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary px-4 text-primary-foreground hover:bg-primary/90",
        variant === "outline" && "border border-border bg-transparent px-4 text-foreground hover:bg-muted",
        variant === "ghost" && "px-3 text-foreground hover:bg-muted",
        variant === "destructive" && "bg-red-700 px-4 text-white hover:bg-red-600",
        size === "sm" && "min-h-8 px-3 text-xs",
        size === "icon" && "size-10 px-0",
        className
      )}
      {...props}
    />
  );
}
