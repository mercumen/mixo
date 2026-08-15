"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Yazdırma penceresini açar. Client olmak zorunda — `window.print()`. */
export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="size-3.5" aria-hidden="true" />
      Yazdır / PDF olarak kaydet
    </Button>
  );
}
