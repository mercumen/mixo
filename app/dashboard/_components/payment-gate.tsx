"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * ÖDEME KAPISI — ödenmemiş etkinlikte kilitli sayfaların yerine geçen ekran.
 *
 * ÖDEME ENTEGRASYONU YOK (CLAUDE.md v2). Düğme şimdilik doğrudan etkinliği
 * ödenmiş işaretliyor; gerçek sağlayıcı geldiğinde aynı düğme checkout'a
 * yönlendirecek, buradaki metin ve akış değişmeyecek.
 *
 * Sahte olduğunu KULLANICIDAN GİZLEMİYORUZ: altında küçük bir not var.
 * Demo sırasında "ödeme aldık mı?" karışıklığı çıkmasın.
 */
export function PaymentGate({
  eventId,
  eventName,
  planName,
  planPrice,
  ne,
}: {
  eventId: string;
  eventName: string;
  planName: string | null;
  planPrice: string | null;
  /** Kilitli olan şeyin adı: "Görevleri", "Canlı akışı" gibi */
  ne: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/events/${eventId}/payment`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ödeme tamamlanamadı.");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-lg gap-0 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent">
        <Lock className="size-5 text-primary" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-[15px] font-semibold tracking-tight">
        {ne} açmak için ödeme gerekiyor
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{eventName}</span> için
        ödeme henüz alınmadı. Ödeme tamamlandığında görevler, canlı akış, sahne
        ve galeri açılır; misafirler QR ile katılmaya başlayabilir.
      </p>

      {planName ? (
        <div className="mt-5 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-[12px] text-muted-foreground">Seçilen paket</p>
          <p className="mt-0.5 text-[14px] font-semibold">
            {planName}
            {planPrice ? (
              <span className="ml-2 text-[12.5px] font-normal text-muted-foreground">
                {planPrice}
              </span>
            ) : null}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-[12.5px] text-destructive">
          Önce bir paket seçmeniz gerekiyor.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-2">
        <Button
          className="w-full"
          disabled={busy || !planName}
          onClick={() => void pay()}
        >
          <CreditCard className="size-4" aria-hidden="true" />
          {busy ? "İşleniyor…" : "Ödemeye Geç"}
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard">Genel Bakış&apos;a dön</Link>
        </Button>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Ödeme altyapısı henüz bağlanmadı — bu düğme şimdilik etkinliği ödenmiş
        olarak işaretliyor.
      </p>

      <p className="mt-3 text-[11px] text-muted-foreground">
        QR kodlarını ödeme beklerken de üretip bastırabilirsiniz.
      </p>
    </Card>
  );
}
