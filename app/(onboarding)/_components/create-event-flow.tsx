"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@/app/(marketing)/_components/icons";
import { ButtonLink } from "@/app/(marketing)/_components/ui";
import {
  emptyDraft,
  eventTypes,
  findGuestRange,
  guestRanges,
  stepHints,
  type EventDraft,
  type EventTypeId,
  type GuestRangeId,
} from "../_lib/event-setup";
import { AuthPanel } from "./auth-panel";
import { ChoiceChips } from "./choice-chips";
import { OnboardingShell } from "./onboarding-shell";
import {
  EmptySlot,
  FilledSlot,
  SentenceLine,
  SlotInput,
  StepHint,
} from "./sentence";
import { StepDots } from "./step-dots";

/**
 * "Etkinliği Yarat" akışı.
 *
 *   cümle kurma (3 adım) → hazırlanıyor → e-posta → kayıt | giriş
 *
 * Tek client component durum tutuyor; adımlar URL'e yansımıyor çünkü akış
 * tek oturumluk ve geri/ileri ile yarıda bölünmesi istenmiyor.
 *
 * ETKİNLİK BURADA YARATILMIYOR. Bu akış sadece cevapları topluyor; hesap
 * açıldıktan sonra cevaplar oturumla panele taşınıyor ve etkinlik Kurulum
 * Sihirbazı'nın 1. adımından doğuyor (tek yaratma yolu).
 *
 * Sunucuya dokunan tek yer `_lib/auth.ts` (kimlik).
 */

const STEP_COUNT = 3;

type Stage =
  | { kind: "wizard" }
  | { kind: "preparing" }
  | { kind: "auth"; eventName: string };

export function CreateEventFlow() {
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>({ kind: "wizard" });

  const guestRange = findGuestRange(draft.guests);
  const answered = {
    type: draft.type !== null,
    guests: draft.guests !== null,
  };

  /** Cevaptan sonra: eksik adım varsa oraya, hepsi tamsa isim adımına. */
  function advanceFrom(index: number, next: EventDraft) {
    const allAnswered = next.type !== null && next.guests !== null;
    setStep(allAnswered ? STEP_COUNT - 1 : index + 1);
  }

  function pickType(id: EventTypeId) {
    const type = eventTypes.find((t) => t.id === id) ?? null;
    const next = { ...draft, type };
    setDraft(next);
    advanceFrom(0, next);
  }

  function pickGuests(id: GuestRangeId) {
    const next = { ...draft, guests: id };
    setDraft(next);
    advanceFrom(1, next);
  }

  /**
   * Taslak tamam. Etkinlik yazımı yok — taslak kimlik adımına, oradan da
   * oturum üzerinden Kurulum Sihirbazı'na taşınıyor.
   *
   * "Etkinlik Hazırlanıyor" ekranı tasarımdan geliyor ve akışı bölmemek için
   * kısa bir geçiş olarak duruyor.
   */
  async function submitDraft() {
    const name = draft.name.trim();
    if (!draft.type || !draft.guests || name.length === 0) return;

    setStage({ kind: "preparing" });
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setStage({ kind: "auth", eventName: name });
  }

  // --- Kimlik adımı: cümle bitti, hesap aşamasına geçildi -------------------
  if (stage.kind === "auth") {
    return (
      <AuthPanel
        accent={draft.type?.accent}
        eventName={stage.eventName}
        draft={{ ...draft, name: stage.eventName }}
      />
    );
  }

  const preparing = stage.kind === "preparing";
  const nameStepVisible = answered.type && answered.guests;

  return (
    <OnboardingShell
      accent={draft.type?.accent}
      footer={false}
      headerRight={
        <ButtonLink href="/giris" variant="dark" size="sm">
          {/* Tam metin nowrap olduğu için mobilde dokümanı viewport'tan geniş
              yapıp sayfayı yatay kaydırıyordu; küçük ekranda kısalıyor. */}
          <span className="hidden sm:inline">Zaten hesabınız var mı?&nbsp;</span>
          Giriş Yap
        </ButtonLink>
      }
    >
      <div className="w-full max-w-[820px]">
        {/* Hazırlanırken cümle donuyor: etkinlik sunucuya gitti, artık
            değiştirilebilir görünmemeli. */}
        <div
          className={`space-y-5 ${preparing ? "pointer-events-none" : ""}`}
          aria-busy={preparing}
        >
          {/* 1 — Etkinlik türü */}
          <SentenceLine>
            <span>Ben bir</span>
            {draft.type ? (
              <FilledSlot
                value={draft.type.label}
                onChange={() => setStep(0)}
                changeLabel="Etkinlik türünü değiştir"
              />
            ) : (
              <EmptySlot label="Etkinlik Türü" />
            )}
            <span>organize ediyorum.</span>
          </SentenceLine>

          {/* 2 — Katılımcı sayısı */}
          {answered.type ? (
            <SentenceLine>
              <span>Yaklaşık</span>
              {guestRange ? (
                <FilledSlot
                  value={guestRange.label}
                  onChange={() => setStep(1)}
                  changeLabel="Katılımcı sayısını değiştir"
                />
              ) : (
                <EmptySlot label="Katılımcı Sayısı" />
              )}
              {/* "ve" ancak 3. satır açıldığında beliriyor */}
              <span>misafirim olacak{nameStepVisible ? " ve" : ""}</span>
            </SentenceLine>
          ) : null}

          {/* 3 — Etkinlik adı */}
          {nameStepVisible && draft.type ? (
            <SentenceLine>
              <label htmlFor="event-name">{draft.type.nameLabel}</label>
              <SlotInput
                id="event-name"
                value={draft.name}
                onValueChange={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder={draft.type.namePlaceholder}
                disabled={preparing}
              />
            </SentenceLine>
          ) : null}
        </div>

        {/* Aktif adımın seçenekleri / eylemi */}
        {preparing ? (
          <PreparingState />
        ) : (
          <>
            {step === 0 ? (
              <>
                <ChoiceChips
                  groupLabel="Etkinlik türü"
                  options={eventTypes.map(({ id, label }) => ({ id, label }))}
                  value={draft.type?.id ?? null}
                  onSelect={pickType}
                />
                <StepHint>{stepHints.type}</StepHint>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <ChoiceChips
                  groupLabel="Katılımcı sayısı"
                  options={guestRanges}
                  value={draft.guests}
                  onSelect={pickGuests}
                />
                <StepHint>{stepHints.guests}</StepHint>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <StepHint>{stepHints.name}</StepHint>
                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    onClick={submitDraft}
                    disabled={draft.name.trim().length === 0}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-semibold whitespace-nowrap text-ink transition-colors duration-200 hover:bg-white/88 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Etkinliğini Yarat
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>
              </>
            ) : null}

            <StepDots current={step} total={STEP_COUNT} />
          </>
        )}
      </div>
    </OnboardingShell>
  );
}

/** "Etkinlik Hazırlanıyor" ara durumu. */
function PreparingState() {
  return (
    <div className="mt-16 flex flex-col items-center gap-4">
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="animate-pulse-dot size-[5px] rounded-full"
            style={{
              backgroundColor: "var(--accent)",
              animationDelay: `${i * 0.14}s`,
            }}
          />
        ))}
      </div>
      <p role="status" className="text-[11.5px] text-fg-subtle italic">
        Etkinlik Hazırlanıyor, Son dokunuşlar...
      </p>
    </div>
  );
}
