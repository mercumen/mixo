"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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

/**
 * Moderasyon modu anahtarı.
 *
 * NEDEN BURADA: onay kuyruğunun hemen üstünde. Organizatör "her kareyi elle
 * onaylamaktan yoruldum" dediği anda çözümü aynı ekranda buluyor.
 *
 * Paket yetmiyorsa anahtar KİLİTLİ ama görünür — asimetrik paket kuralımız:
 * Essential kullanıcısı özelliğin varlığını görsün.
 *
 * Otomatiğe geçmek geri alınamaz bir şey değil ama sonucu büyük (kareler
 * insan görmeden ekrana düşmeye başlıyor), o yüzden tek onay alıyoruz.
 */
export function ModerationModeSwitch({
  eventId,
  mode,
  aiAllowed,
}: {
  eventId: string;
  mode: "manuel" | "otomatik";
  aiAllowed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otomatik = mode === "otomatik";

  async function change(next: boolean) {
    if (busy) return;
    if (
      next &&
      !window.confirm(
        "Otomatik moderasyonda fotoğraflar yapay zeka onayıyla ekrana düşer, sen görmeden. Devam edilsin mi?",
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moderationMode: next ? "otomatik" : "manuel" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Değiştirilemedi.");
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold">
            {otomatik ? "Otomatik moderasyon" : "Elle onay"}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
            {otomatik
              ? "Yapay zeka karar veriyor; sadece arıza durumunda sana düşüyor."
              : aiAllowed
                ? "Her fotoğraf onayına düşüyor. Yapay zekaya bırakmak için aç."
                : "Her fotoğraf onayına düşüyor. Otomatik mod Professional ve üstünde."}
          </p>
        </div>
        <Switch
          checked={otomatik}
          disabled={busy || !aiAllowed}
          onCheckedChange={(v) => void change(v)}
          aria-label="Otomatik moderasyonu aç/kapat"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[11.5px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
