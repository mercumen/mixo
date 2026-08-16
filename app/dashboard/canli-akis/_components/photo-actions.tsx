"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Moderasyon işlemleri — onayla / reddet / akıştan kaldır.
 *
 * Hepsi aynı uca gidiyor (`/api/events/{id}/moderation`), fark sadece
 * gönderilen eylemde. Onaylanan fotoğraf feed dokümanına giriyor,
 * reddedilen hem feed'den hem R2'den siliniyor (KVKK).
 */

async function moderate(
  eventId: string,
  photoId: string,
  action: "onayla" | "reddet",
) {
  return fetch(`/api/events/${eventId}/moderation`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ photoId, action }),
  });
}

export function ReviewButtons({
  eventId,
  photoId,
}: {
  eventId: string;
  photoId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(action: "onayla" | "reddet") {
    if (busy) return;
    setBusy(true);
    await moderate(eventId, photoId, action);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Button
        size="sm"
        variant="secondary"
        className="bg-accent text-[12px] text-accent-foreground hover:bg-accent/80"
        disabled={busy}
        onClick={() => void decide("onayla")}
      >
        Onayla
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-[12px]"
        disabled={busy}
        onClick={() => void decide("reddet")}
      >
        Reddet
      </Button>
    </div>
  );
}

/** Onaylanmış kareyi ekrandan geri çeker (reddet = feed'den düşer + silinir). */
export function RemoveFromFeedButton({
  eventId,
  photoId,
  task,
}: {
  eventId: string;
  photoId: string;
  task: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    // Geri alınamaz: fotoğraf R2'den de siliniyor
    if (!window.confirm("Bu fotoğraf akıştan kaldırılıp silinsin mi?")) return;

    setBusy(true);
    await moderate(eventId, photoId, "reddet");
    setBusy(false);
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      className="absolute top-2 right-2 z-10 size-7 bg-card/85 text-muted-foreground backdrop-blur hover:text-destructive"
      aria-label={`Akıştan kaldır: ${task}`}
      disabled={busy}
      onClick={() => void remove()}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
