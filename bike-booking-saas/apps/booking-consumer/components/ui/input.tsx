import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-11 w-full rounded border border-white/10 bg-[#131313] px-3 text-sm text-white outline-none transition-all placeholder:text-muted-foreground focus:border-[#69daff]/50 focus:ring-2 focus:ring-[#69daff]/10",
        props.className
      )}
    />
  );
}
