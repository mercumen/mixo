"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Link2,
  PartyPopper,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GuideStep } from "@/lib/guide";

/**
 * ORGANİZASYONA HAZIRLIK — ödeme sonrası Genel Bakış'ın ana kartı.
 *
 * Hesap sunucuda yapılıyor (lib/guide.ts), burası sadece basıyor ve elle
 * kaydedilen üç adımın düğmelerini çalıştırıyor. Adım işaretlenince
 * `router.refresh()` — durum tek kaynaktan (sunucudan) geri geliyor,
 * burada ikinci bir kopya state tutulmuyor.
 */
export function GuideCard({
  eventId,
  code,
  displayUrl,
  steps,
  dismissed,
}: {
  eventId: string;
  code: string;
  displayUrl: string;
  steps: GuideStep[];
  dismissed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const next = steps.find((s) => !s.done);

  async function mark(step: string) {
    setBusy(step);
    await fetch(`/api/events/${eventId}/guide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step }),
    }).catch(() => {});
    setBusy(null);
    router.refresh();
  }

  /** Ekranı yeni sekmede açar; açabilmek işaretlemek için yeterli sayılıyor. */
  function openDisplay() {
    window.open(displayUrl, "_blank", "noopener");
    void mark("ekran");
  }

  async function copyDisplayUrl() {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano izni yoksa adres zaten görünür durumda
    }
  }

  if (dismissed) return null;

  // Hepsi bitti: kart tek satıra iner, kalıcı olarak kapatılabilir
  if (allDone) {
    return (
      <Card className="flex-row items-center gap-3 border-primary/30 bg-accent/40 px-5 py-4">
        <PartyPopper className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">Etkinliğin hazır 🎉</p>
          <p className="text-[12px] text-muted-foreground">
            Tüm hazırlık adımları tamamlandı. Etkinlik günü ekranı açman yeterli.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          aria-label="Hazırlık kartını kapat"
          onClick={() => void mark("gizli")}
        >
          <X className="size-4" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Organizasyona Hazırlık
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {next
              ? `Sıradaki adım: ${next.title}`
              : "Son adımlar tamamlanıyor."}
          </p>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-accent-foreground">
          {doneCount}/{steps.length} tamamlandı
        </span>
      </div>

      <ol className="mt-5 space-y-1">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
          >
            <span
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
              aria-hidden="true"
            >
              {step.done ? <Check className="size-3.5" /> : i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-medium ${
                  step.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {step.title}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                  {step.description}
                  {step.id === "telefon" ? (
                    <>
                      {" "}
                      Etkinlik kodun: <strong className="font-semibold">{code}</strong>
                    </>
                  ) : null}
                </p>
              )}
            </div>

            {!step.done && (
              <StepAction
                step={step}
                busy={busy}
                onMark={mark}
                onOpenDisplay={openDisplay}
                onCopy={copyDisplayUrl}
                copied={copied}
              />
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/**
 * Adımın sağındaki eylem.
 *
 * qr: sayfadaki QR kartına kaydırıyor (indirme oradan; indirince kendi
 * kendini işaretliyor). ekran: yeni sekme + işaret. Diğerleri düz bağlantı.
 */
function StepAction({
  step,
  busy,
  onMark,
  onOpenDisplay,
  onCopy,
  copied,
}: {
  step: GuideStep;
  busy: string | null;
  onMark: (step: string) => Promise<void>;
  onOpenDisplay: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  /**
   * Moderasyonun iki çıkışı var: anahtarı değiştirmek (Canlı Akış'taki switch
   * adımı kendisi işaretliyor) YA DA varsayılanda kalmak. Varsayılanda kalan
   * kullanıcı anahtara hiç dokunmayacağı için buradan "böyle kalsın"
   * diyebiliyor — yoksa adım sonsuza dek açık kalırdı.
   */
  if (step.id === "moderasyon") {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] text-muted-foreground"
          disabled={busy === "moderasyon"}
          onClick={() => void onMark("moderasyon")}
        >
          Elle onayda kalacağım
        </Button>
        <Button asChild variant="outline" size="sm" className="text-[12px]">
          <Link href={step.href ?? "/dashboard/canli-akis"}>
            Git
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </span>
    );
  }

  if (step.id === "ekran") {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="text-[12px]"
          onClick={onCopy}
          aria-label="Ekran bağlantısını kopyala"
        >
          <Link2 className="size-3.5" aria-hidden="true" />
          {copied ? "Kopyalandı" : "Bağlantı"}
        </Button>
        <Button
          size="sm"
          className="text-[12px]"
          disabled={busy === "ekran"}
          onClick={onOpenDisplay}
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          Ekranı Aç
        </Button>
      </span>
    );
  }

  if (step.id === "qr") {
    return (
      <Button asChild variant="outline" size="sm" className="shrink-0 text-[12px]">
        <a href="#qr-karti">
          QR kartına git
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </Button>
    );
  }

  if (!step.href) return null;
  return (
    <Button asChild variant="outline" size="sm" className="shrink-0 text-[12px]">
      <Link href={step.href}>
        Git
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </Button>
  );
}
