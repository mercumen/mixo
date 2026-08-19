"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Etkinliği aktif yapan düğme.
 *
 * Seçim ÇEREZDE tutuluyor (bkz. _lib/context.ts). Çerezi sunucu uçtan
 * yazıyor; istemciden `document.cookie` ile yazmak da mümkündü ama o zaman
 * sahiplik doğrulaması istemcinin insafına kalırdı.
 */
export function ActivateEventButton({
  eventId,
  aktif,
}: {
  eventId: string;
  aktif: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function activate() {
    if (busy || aktif) return;
    setBusy(true);
    await fetch("/api/events/active", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    setBusy(false);
    // Panelin tamamı bu seçime bağlı — kökten yeniliyoruz
    router.push("/dashboard");
    router.refresh();
  }

  if (aktif) {
    return (
      <Button size="sm" variant="secondary" disabled className="w-full">
        Açık
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={() => void activate()}
    >
      {busy ? "Açılıyor…" : "Bu etkinliği aç"}
    </Button>
  );
}
