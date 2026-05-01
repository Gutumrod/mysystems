import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded border border-white/10 bg-[#131313] px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-muted-foreground focus:border-[#69daff]/50 focus:ring-2 focus:ring-[#69daff]/10",
        props.className
      )}
    />
  );
}
