"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  clearEventDraft,
  getEventDraftSnapshot,
  subscribeToEventDraft,
} from "@/lib/event-draft";
import type { EventDoc } from "@/lib/schema";
import { setupSteps, type SetupStepId } from "@/lib/setup-steps";
import { PlanPicker } from "@/app/_components/plan-picker";
import { isPlanId, type PlanId } from "@/lib/plans";
import {
  defaultModeForPlan,
  type ReferenceKind,
  type StageMode,
} from "@/lib/stage-templates";
import { StepEventInfo, type EventInfoValues } from "./step-event-info";
import { StepMissions, type MissionValues } from "./step-missions";
import { StepStage } from "./step-stage";
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
 * ADIM SIRASI: Paket → Etkinlik Bilgileri → Sahne → Görev Havuzu → Ekip.
 * Paket en başta çünkü kullanılabilir sahne şablonları ona bağlı.
 *
 * ETKİNLİK "Etkinlik Bilgileri" ADIMINDA DOĞUYOR (`event` null ise POST).
 * Paket adımı ondan önce geldiği için seçim o ana kadar yerel state'te
 * bekliyor ve POST ile birlikte gönderiliyor.
 *
 * Landing'de paket seçilmişse bu adım TAMAMLANMIŞ sayılıp doğrudan
 * 2. adımdan başlıyoruz — aynı soruyu iki kez sormuyoruz.
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

/**
 * Taslağı MOUNT'TAN SONRA okur.
 *
 * `useSyncExternalStore`, sunucu ve istemci için ayrı snapshot alabildiği için
 * tam bu iş için var: sunucuda `null`, istemcide gerçek taslak.
 * Snapshot önbelleklenmiş (bkz. lib/event-draft.ts) — her çağrıda yeni nesne
 * dönerse React sonsuz render döngüsüne girer.
 */
function useDraftAfterMount(enabled: boolean) {
  const draft = useSyncExternalStore(
    subscribeToEventDraft,
    getEventDraftSnapshot,
    // Sunucu snapshot'ı: taslak yok. İlk render sunucuyla birebir aynı olsun.
    () => null,
  );
  return enabled ? draft : null;
}

export function SetupWizard({
  event,
  missionCount,
}: {
  event: EventDoc | null;
  /** Etkinlik yaratılırken kopyalanan hazır görev sayısı */
  missionCount: number;
}) {
  const router = useRouter();
  const draftForStart = event === null ? getEventDraftSnapshot() : null;

  const [step, setStep] = useState<SetupStepId>(() => {
    const done = new Set(event?.completedSteps ?? []);
    // Landing'de paket seçildiyse o adım bitmiş sayılıyor
    if (draftForStart?.planId) done.add("paket");
    return setupSteps.find((s) => !done.has(s.id))?.id ?? "paket";
  });

  /**
   * Kullanıcının bu oturumda yaptığı DEĞİŞİKLİKLER. Görünen değer bunun
   * `base` üzerine bindirilmesiyle türetiliyor.
   *
   * NEDEN BÖYLE: taslak `sessionStorage`'da ve orayı render sırasında okumak
   * sunucuda boş, istemcide dolu sonuç veriyordu — kontrollü input'larda
   * hidrasyon uyuşmazlığı (dev overlay'de "hydration/rendering" hatası).
   *
   * Türetme bunu çözüyor: sunucu ve istemcinin ilk render'ı aynı (taslak
   * henüz okunmamış), taslak mount'tan sonra normal bir yeniden render ile
   * geliyor. `edits` her zaman üstte kaldığı için kullanıcının yazdığı
   * değer taslak tarafından ezilmiyor.
   *
   * Effect içinde setState de yapmıyoruz — o hem lint kuralına takılıyor hem
   * gereksiz bir render turu ekliyor.
   */
  const [edits, setEdits] = useState<Partial<EventInfoValues>>({});
  /**
   * Paket seçimi. Etkinlik henüz yoksa POST'a kadar burada bekliyor —
   * Paket adımı, etkinliği yaratan adımdan (Etkinlik Bilgileri) önce geliyor.
   */
  const [planId, setPlanId] = useState<PlanId | null>(() => {
    if (event && isPlanId(event.planId)) return event.planId;
    const p = draftForStart?.planId;
    return isPlanId(p) ? p : null;
  });
  // --- Sahne adımı -----------------------------------------------------------
  const [mode, setMode] = useState<StageMode | null>(event?.stageMode ?? null);
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>(
    event?.stageReferenceKind === "foto" ? "foto" : "logo",
  );

  // --- Görev Havuzu adımı ----------------------------------------------------
  const [missionValues, setMissionValues] = useState<MissionValues>({
    subject: event?.missionSubject ?? "",
    tone: event?.missionTone ?? "",
    theme: event?.missionTheme ?? "",
    facts: event?.missionFacts ?? [],
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useDraftAfterMount(event === null);

  const base: EventInfoValues = event
    ? initialValues(event)
    : { ...EMPTY_VALUES, name: draft?.name ?? "", typeId: draft?.typeId ?? "" };
  const values: EventInfoValues = { ...base, ...edits };

  const meta = setupSteps.find((s) => s.id === step)!;
  const stepIndex = setupSteps.findIndex((s) => s.id === step);
  const completedSteps = [
    ...(event?.completedSteps ?? []),
    // Landing'de seçildiyse ray da tamamlanmış göstersin
    ...(planId && !(event?.completedSteps ?? []).includes("paket")
      ? ["paket"]
      : []),
  ];
  /** Landing'den gelen aralık; etkinlik yaratılırken sunucuya iletiliyor. */
  const draftGuestRange = draft?.guestRange || null;

  function close() {
    // Modal durumu URL'de: kapanınca parametre düşüyor, geri tuşu da çalışıyor
    router.push("/dashboard");
  }

  async function save(markComplete: boolean) {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};

      if (step === "paket") {
        if (!planId) {
          setError("Bir paket seçin.");
          setBusy(false);
          return;
        }
        // Etkinlik yoksa paket POST ile birlikte gidecek, ayrı istek yok
        if (!event) {
          setBusy(false);
          setStep("bilgiler");
          return;
        }
        body.planId = planId;
      }

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
        // Paket adımı önce geldiği için seçim burada gönderiliyor
        if (planId) body.planId = planId;
      }

      if (step === "sahne") {
        /**
         * Mod seçilmediyse paketin tek modunu varsayıyoruz — her paketin bir
         * modu var, kullanıcıyı zorunlu tıklamaya mecbur etmiyoruz.
         */
        const chosen = mode ?? defaultModeForPlan(planId);
        if (!chosen) {
          setError("Bir sahne modu seçin.");
          setBusy(false);
          return;
        }
        body.stageMode = chosen;
        if (chosen === "mozaik") body.stageReferenceKind = referenceKind;
      }

      if (step === "gorevler") {
        // Essential'da AI yok; bu adım bilgilendirme, kaydedilecek girdi de yok
        if (planId !== "essential") {
          Object.assign(body, {
            missionSubject: missionValues.subject,
            missionTone: missionValues.tone,
            missionTheme: missionValues.theme,
            missionFacts: missionValues.facts,
          });
        }
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
        className={
          step === "paket"
            ? "max-w-[1040px] gap-0 overflow-hidden p-0 sm:max-w-[1040px]"
            : "max-w-[880px] gap-0 overflow-hidden p-0 sm:max-w-[880px]"
        }
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
            hintOverrides={
              planId === "essential"
                ? {
                    // Essential'da AI görev üretimi yok
                    gorevler: "Türüne göre hazır görevler",
                    sahne: "Akış şablonu",
                  }
                : undefined
            }
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-7 pb-4">
              <DialogTitle className="text-[16px] font-semibold tracking-tight">
                {step === "paket"
                  ? "Hangi paket sana uygun?"
                  : step === "sahne"
                    ? "Salonda ne görünsün?"
                    : step === "gorevler"
                      ? "Misafirlere ne görevler verelim?"
                      : meta.title}
              </DialogTitle>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {step === "paket"
                  ? "Paketler etkinlik başına; abonelik yok, otomatik yenileme yok. Salonda görünecek sahne şablonları da pakete göre değişiyor."
                  : step === "bilgiler"
                    ? "Tarih ve saat her şeyi besliyor: geri sayım, sahne ekranının açılışı, davet süreleri."
                    : step === "sahne"
                      ? "Önce türü seç: fotoğrafların bir görseli oluşturduğu mozaik mi, yoksa serbest akan bir ekran mı?"
                      : step === "gorevler"
                        ? planId === "essential"
                          ? "Etkinlik türünüze uygun görevler hazır. Dilediğiniz gibi düzenleyebilirsiniz."
                          : "Birkaç bilgi ver, AI etkinliğine özel görevleri senin yerine yazsın."
                        : meta.hint}
              </p>

              <div className="mt-6">
                {step === "paket" ? (
                  <PlanPicker
                    tone="light"
                    value={planId}
                    onSelect={setPlanId}
                    disabled={busy}
                  />
                ) : step === "bilgiler" ? (
                  <StepEventInfo
                    values={values}
                    onChange={(patch) =>
                      setEdits((e) => ({ ...e, ...patch }))
                    }
                  />
                ) : step === "sahne" ? (
                  <StepStage
                    planId={planId}
                    mode={mode ?? defaultModeForPlan(planId)}
                    referenceKind={referenceKind}
                    hasReferenceFile={event?.stageReferenceKey !== null}
                    onModeChange={setMode}
                    onReferenceKindChange={setReferenceKind}
                    disabled={busy}
                  />
                ) : step === "gorevler" ? (
                  <StepMissions
                    planId={planId}
                    values={missionValues}
                    missionCount={missionCount}
                    onChange={(patch) =>
                      setMissionValues((v) => ({ ...v, ...patch }))
                    }
                    disabled={busy}
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
