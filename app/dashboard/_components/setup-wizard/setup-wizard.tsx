"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { clearEventDraft, readEventDraft } from "@/lib/event-draft";
import type { EventDoc } from "@/lib/schema";
import { setupSteps, type SetupStepId } from "@/lib/setup-steps";
import { StepEventInfo, type EventInfoValues } from "./step-event-info";
import { WizardRail } from "./wizard-rail";

/**
 * Kurulum Sihirbazı.
 *
 * PANEL İÇİNDEKİ etkinlik kurulumu burası. Landing'deki cümle sihirbazı
 * (`/etkinlik-olustur`) ile KARIŞTIRILMAMALI: o yeni kullanıcıyı içeri almak
 * için sadece üç şey soruyor (tür, misafir aralığı, ad). Bu ise etkinliği
 * canlıya hazırlayan asıl yer.
 *
 * Landing'de verilen kararlar burada ÖNCEDEN DOLU geliyor — kullanıcı aynı
 * soruyu iki kez cevaplamıyor.
 *
 * ETKİNLİK BURADAN DOĞUYOR: `event` null ise 1. adım POST ile yaratıyor,
 * doluysa PATCH ile güncelliyor. Landing'in cevapları oturumdan okunup
 * forma önceden yazılıyor.
 *
 * ŞU AN sadece 1. adım işliyor. Diğer dördü sırayla eklenecek; ray ve
 * kaydetme altyapısı hazır.
 */

const EMPTY_VALUES: EventInfoValues = {
  name: "",
  typeId: "",
  date: "",
  startTime: "",
  endTime: "",
  expectedGuests: "",
  locationName: "",
};

function initialValues(event: EventDoc): EventInfoValues {
  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  const timeIn = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Europe/Istanbul",
        }).format(d)
      : "";

  return {
    // Landing'den gelen iki alan
    name: event.name,
    typeId: event.typeId,
    // Sihirbazda doldurulacak alanlar
    date: startsAt ? startsAt.toISOString().slice(0, 10) : "",
    startTime: timeIn(startsAt),
    endTime: timeIn(endsAt),
    expectedGuests:
      event.expectedGuests !== null ? String(event.expectedGuests) : "",
    locationName: event.locationName ?? "",
  };
}

export function SetupWizard({ event }: { event: EventDoc | null }) {
  const router = useRouter();
  const [step, setStep] = useState<SetupStepId>(
    // Yarıda kalmışsa kaldığı yerden devam
    setupSteps.find((s) => !(event?.completedSteps ?? []).includes(s.id))?.id ??
      "bilgiler",
  );

  /**
   * Etkinlik yoksa landing'in oturumdaki cevaplarından dolduruyoruz.
   * `useState` başlatıcısı içinde okumak güvenli: sadece istemcide çalışıyor.
   */
  const [values, setValues] = useState<EventInfoValues>(() => {
    if (event) return initialValues(event);
    const draft = readEventDraft();
    return draft
      ? { ...EMPTY_VALUES, name: draft.name, typeId: draft.typeId }
      : EMPTY_VALUES;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = setupSteps.find((s) => s.id === step)!;
  const stepIndex = setupSteps.findIndex((s) => s.id === step);
  const completedSteps = event?.completedSteps ?? [];
  /** Landing'den gelen aralık; etkinlik yaratılırken sunucuya iletiliyor. */
  const draftGuestRange = event ? null : readEventDraft()?.guestRange || null;

  function close() {
    // Modal durumu URL'de: kapanınca parametre düşüyor, geri tuşu da çalışıyor
    router.push("/dashboard");
  }

  async function save(markComplete: boolean) {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};

      if (step === "bilgiler") {
        Object.assign(body, {
          name: values.name,
          typeId: values.typeId,
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          expectedGuests: values.expectedGuests || undefined,
          locationName: values.locationName,
        });
        if (draftGuestRange) body.guestRange = draftGuestRange;
      }

      if (markComplete) body.completedStep = step;

      // Etkinlik yoksa yaratıyoruz, varsa güncelliyoruz — tek yaratma yolu burası
      const res = event
        ? await fetch(`/api/events/${event.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Kaydedilemedi.");
      }

      // Etkinlik yaratıldı, taslağın işi bitti
      if (!event) clearEventDraft();

      // Sunucu verisi değişti; panel bu veriyi sunucuda okuduğu için tazele
      router.refresh();

      const next = setupSteps[stepIndex + 1];
      if (next) {
        setStep(next.id);
      } else {
        close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  const isLast = stepIndex === setupSteps.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton
        className="max-w-[860px] gap-0 overflow-hidden p-0 sm:max-w-[860px]"
      >
        <div className="flex max-h-[86vh]">
          <WizardRail
            eventName={values.name || "Yeni Etkinlik"}
            dateLabel={
              event?.startsAt
                ? new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Istanbul",
                  })
                    .format(new Date(event.startsAt))
                    .replace(",", " •")
                : "Tarih belirlenmedi"
            }
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={setStep}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-7 pb-4">
              <DialogTitle className="text-[16px] font-semibold tracking-tight">
                {step === "bilgiler" ? "Etkinlik Bilgileri" : meta.title}
              </DialogTitle>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {step === "bilgiler"
                  ? "Tarih ve saat her şeyi besliyor: geri sayım, sahne ekranının açılışı, davet süreleri."
                  : meta.hint}
              </p>

              <div className="mt-6">
                {step === "bilgiler" ? (
                  <StepEventInfo
                    values={values}
                    onChange={(patch) =>
                      setValues((v) => ({ ...v, ...patch }))
                    }
                  />
                ) : (
                  // Kalan adımlar sırayla eklenecek
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
                    <p className="text-[12.5px] font-medium">
                      {meta.title} adımı henüz hazır değil
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      Bu adımı şimdilik atlayabilirsin.
                    </p>
                  </div>
                )}
              </div>

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-[11.5px] text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-7 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={stepIndex === 0 || busy}
                onClick={() => setStep(setupSteps[stepIndex - 1].id)}
              >
                Geri
              </Button>

              <span className="hidden flex-1 text-[11.5px] text-muted-foreground sm:block">
                Tüm seçimler sonradan değiştirilebilir
              </span>

              <div className="flex items-center gap-3">
                {meta.skippable ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const next = setupSteps[stepIndex + 1];
                      if (next) setStep(next.id);
                      else close();
                    }}
                    className="text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    Şimdilik Atla
                  </button>
                ) : null}

                <Button size="sm" disabled={busy} onClick={() => void save(true)}>
                  {busy
                    ? "Kaydediliyor…"
                    : isLast
                      ? "Kurulumu Bitir"
                      : "Devam Et"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
