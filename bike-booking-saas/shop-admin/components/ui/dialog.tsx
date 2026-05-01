"use client";

import { X } from "lucide-react";
import { Button } from "./button";

type Props = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ title, open, onOpenChange, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="ปิด">
            <X />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
