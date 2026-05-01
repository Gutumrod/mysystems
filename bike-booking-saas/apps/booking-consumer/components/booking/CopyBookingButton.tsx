"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyBookingButton({ text }: { text: string }) {
  const [copyError, setCopyError] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopyError(false);
            toast.success("คัดลอกข้อความแล้ว");
          } catch {
            setCopyError(true);
          }
        }}
        className="w-full sm:w-auto"
      >
        <Copy data-icon="inline-start" />
        คัดลอกข้อความ
      </Button>
      {copyError && (
        <p className="text-sm text-destructive">ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง</p>
      )}
    </div>
  );
}
