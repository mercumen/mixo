"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { InfoNote } from "./ui-bits";

/**
 * QR Kodunu İndir.
 *
 * İKİ SEÇENEK (tasarımdan):
 *   Şablonlu Tasarım → masa kartı. Baskı yolu, tarayıcının yazdırma
 *                      penceresinden PDF olarak kaydediliyor. Ayrı bir PDF
 *                      kütüphanesi KURULMADI — tarayıcının çıktısı daha iyi
 *                      (vektör metin, doğru DPI) ve bir bağımlılık eksik.
 *   Sadece QR Kodu   → şeffaf zeminli PNG. Canvas'a çizilip indiriliyor;
 *                      organizatör kendi davetiyesine gömüyor.
 *
 * PNG'de MIXO logosu QR'ın ortasına basılıyor. Kod en yüksek hata düzeltme
 * seviyesiyle üretildiği için (bkz. lib/qr.ts) logo okunurluğu bozmuyor.
 */

type Choice = "sablon" | "sade";

export function QrDownloadModal({
  eventName,
  code,
  qrDataUrl,
  printDeadline,
}: {
  eventName: string;
  code: string;
  qrDataUrl: string;
  /** Baskı için son tarih metni — etkinlik tarihinden türetiliyor */
  printDeadline: string | null;
}) {
  const [choice, setChoice] = useState<Choice>("sablon");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * PNG indirme — QR + ortada MIXO logosu, canvas'ta birleştiriliyor.
   *
   * Şeffaf zemin: QR beyaz dolgulu geldiği için beyaz pikselleri saydam
   * yapıyoruz. Böylece organizatör koyu bir davetiyeye de koyabiliyor.
   */
  async function downloadPng() {
    setBusy(true);
    try {
      const size = 1024;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas yok");

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("QR yüklenemedi"));
        img.src = qrDataUrl;
      });

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      // Beyazı saydama çevir — şeffaf zemin isteniyor
      const data = ctx.getImageData(0, 0, size, size);
      for (let i = 0; i < data.data.length; i += 4) {
        const [r, g, b] = [data.data[i], data.data[i + 1], data.data[i + 2]];
        if (r > 240 && g > 240 && b > 240) data.data[i + 3] = 0;
      }
      ctx.putImageData(data, 0, 0);

      // Ortaya logo: beyaz pad + MIXO yazısı
      const pad = size * 0.14;
      const boxW = size * 0.28;
      const boxH = size * 0.11;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect((size - boxW) / 2, (size - boxH) / 2, boxW, boxH);
      ctx.fillStyle = "#000000";
      ctx.font = `800 ${Math.round(size * 0.062)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = `${Math.round(size * 0.008)}px`;
      ctx.fillText("MIXO", size / 2, size / 2 + size * 0.004);
      void pad;

      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/png"),
      );
      if (!blob) throw new Error("PNG üretilemedi");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mixo-qr-${code}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-[12px]">
          Kodu İndir
        </Button>
      </DialogTrigger>

      {/* min(): dar ekranda viewport'tan taşmasın; içerik uzayınca modal içi kaydırılır */}
      <DialogContent
        showCloseButton
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(600px,calc(100vw-2rem))]"
      >
        <DialogTitle className="text-[16px] font-semibold tracking-tight">
          QR Kodunu İndir
        </DialogTitle>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Masaya koyacağın hazır tasarımı ya da tek başına QR görselini indir.
        </p>

        {printDeadline ? (
          <InfoNote className="mt-4" icon={<Printer className="size-3.5" />}>
            <p className="font-semibold text-foreground">
              Baskıyı 1 hafta önceden planlayın
            </p>
            <p className="mt-0.5">
              Dosyayı en geç{" "}
              <strong className="font-semibold">{printDeadline}</strong>{" "}
              tarihinde matbaaya iletin. Provada renk ve kod okunurluğunu
              kontrol etmek için <strong className="font-semibold">1 hafta pay</strong>{" "}
              bırakmanızı öneririz.
            </p>
          </InfoNote>
        ) : null}

        <div
          role="radiogroup"
          aria-label="İndirme türü"
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <Option
            selected={choice === "sablon"}
            onSelect={() => setChoice("sablon")}
            title="Şablonlu Tasarım"
            badge="Önerilen"
            caption="Yönlendirme metinleri hazır; karekodun ne işe yaradığını misafire anlatır."
            preview={
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2">
                <span className="text-[7px] font-extrabold tracking-[0.14em] text-neutral-900">
                  MIXO
                </span>
                <span className="font-serif text-[9px] text-neutral-700">
                  {eventName.slice(0, 22)}
                </span>
                <QrCode className="size-9 text-neutral-900" aria-hidden="true" />
                <span className="font-mono text-[7px] tracking-widest text-neutral-500">
                  {code}
                </span>
              </div>
            }
          />

          <Option
            selected={choice === "sade"}
            onSelect={() => setChoice("sade")}
            title="Sadece QR Kodu"
            caption="Şeffaf zeminli, yüksek çözünürlüklü. Kendi davetiye ve tabelalarına yerleştir."
            preview={
              <div className="grid h-full w-full place-items-center rounded-lg bg-muted">
                <QrCode
                  className="size-16 text-foreground"
                  aria-hidden="true"
                />
              </div>
            }
          />
        </div>

        {choice === "sade" ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Şeffaf zemin koyu bir arka plana konursa kod okunmaz olur — açık
            zemine yerleştirin ya da kodun altına beyaz bir alan bırakın.
          </p>
        ) : null}

        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">
          {choice === "sablon" ? (
            <Button asChild size="sm">
              {/* Baskı sayfası panel kabuğunun dışında — çıktıya sidebar girmesin */}
              <Link href="/qr" target="_blank">
                <Printer className="size-3.5" aria-hidden="true" />
                Baskı Sayfasını Aç
              </Link>
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => void downloadPng()}>
              {busy ? "Hazırlanıyor…" : "PNG İndir"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Option({
  selected,
  onSelect,
  title,
  badge,
  caption,
  preview,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  badge?: string;
  caption: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-accent/40 ring-1 ring-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      {badge ? (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
          {badge}
        </span>
      ) : null}
      <div className="h-[128px]">{preview}</div>
      <p className="mt-3 flex items-center gap-1.5 px-0.5 text-[12.5px] font-semibold">
        {title}
        {selected ? (
          <Check className="size-3.5 text-primary" aria-hidden="true" />
        ) : null}
      </p>
      <p className="mt-1 px-0.5 pb-0.5 text-[11px] leading-relaxed text-muted-foreground">
        {caption}
      </p>
    </button>
  );
}
