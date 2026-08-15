"use client";

import { Info, Lock } from "lucide-react";
import {
  lockedModesForPlan,
  modesForPlan,
  referenceKinds,
  type ReferenceKind,
  type StageMode,
} from "@/lib/stage-templates";
import { cn } from "@/lib/utils";
import { TemplateThumb } from "@/app/dashboard/sahne/_components/template-thumb";
import { ReferenceUpload, UploadIcon } from "../reference-upload";
import { InfoNote } from "../ui-bits";

/**
 * Sihirbaz adımı — Sahne Görünümü. "Salonda ne görünsün?"
 *
 * PAKETE GÖRE:
 *   Essential      → sadece "Ambiyans & Akış". Mozaik Portre kilitli görünüyor
 *                    (yükseltme daveti). Referans yükleme YOK — akış modunda
 *                    hedef görsel diye bir şey olmadığı için sorulmuyor.
 *   Üst paketler   → "Mozaik Portre" ve referans yükleme. "Ambiyans & Akış"
 *                    hiç gösterilmiyor (asimetrik kural).
 *
 * Burada MOD seçiliyor, şablon değil. Şablon Sahne sayfasında seçiliyor —
 * tasarımın alt notu da bunu söylüyor.
 */

/** Mod kartının küçük görseli için temsili şablon. */
const previewFor: Record<StageMode, string> = {
  mozaik: "mozaik-portre",
  akis: "organik-kolaj",
};

export function StepStage({
  eventId,
  planId,
  mode,
  referenceKind,
  hasReferenceFile,
  onModeChange,
  onReferenceKindChange,
  onUploaded,
  disabled,
}: {
  /** Etkinlik henüz yaratılmadıysa null — yükleme o zaman kapalı */
  eventId: string | null;
  planId: string | null;
  mode: StageMode | null;
  referenceKind: ReferenceKind;
  hasReferenceFile: boolean;
  onModeChange: (mode: StageMode) => void;
  onReferenceKindChange: (kind: ReferenceKind) => void;
  onUploaded: () => void;
  disabled?: boolean;
}) {
  const available = modesForPlan(planId);
  const locked = lockedModesForPlan(planId);
  // Referans yalnızca hedef görsel oluşturan modda anlamlı
  const showReference = mode === "mozaik";

  return (
    <div className="space-y-7">
      <div
        role="radiogroup"
        aria-label="Sahne modu"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {available.map((m) => {
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onModeChange(m.id)}
              className={cn(
                "relative rounded-xl border bg-card p-3 text-left transition-colors",
                selected
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              {m.featured ? (
                <span className="absolute top-5 right-5 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground">
                  Öne Çıkan
                </span>
              ) : null}
              <div className="h-[108px]">
                <TemplateThumb id={previewFor[m.id]} />
              </div>
              <p className="mt-3 px-1 text-[13px] font-semibold">{m.name}</p>
              <p className="mt-1 px-1 pb-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {m.description}
              </p>
            </button>
          );
        })}

        {/* Essential'a yükseltme daveti — seçilemez */}
        {locked.map((m) => (
          <div
            key={m.id}
            aria-disabled="true"
            className="relative rounded-xl border border-border bg-card p-3 opacity-60"
          >
            <div className="relative h-[108px]">
              <TemplateThumb id={previewFor[m.id]} />
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/45">
                <Lock className="size-4 text-white/90" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 px-1 text-[13px] font-semibold">{m.name}</p>
            <p className="mt-1 px-1 pb-1 text-[11.5px] leading-relaxed text-muted-foreground">
              Üst paketlerde açılıyor.
            </p>
          </div>
        ))}
      </div>

      {showReference ? (
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight">
            Fotoğraflar neyi oluştursun?
          </h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Tek bir referans seçiyorsun — tüm mozaik efektleri aynı görseli
            üretir.
          </p>

          {/* Sihirbazda "Hazır Şekil" yok: burada logo/fotoğraf soruluyor,
              hazır şekiller Sahne sayfasında. Tasarım da öyle. */}
          <div
            role="radiogroup"
            aria-label="Referans türü"
            className="mt-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1"
          >
            {referenceKinds
              .filter((k) => k.id !== "sekil")
              .map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={referenceKind === k.id}
                  disabled={disabled}
                  onClick={() => onReferenceKindChange(k.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                    referenceKind === k.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k.label}
                </button>
              ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-accent/50 px-4 py-4">
            <UploadIcon />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">
                {referenceKind === "logo"
                  ? "Kurumsal Logonuzu Yükleyin"
                  : "Referans Fotoğrafı Yükleyin"}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {referenceKind === "logo"
                  ? "Şeffaf zeminli PNG önerilir, logonun dolu alanları mozaiğin şeklini belirler. En az 600×600 px."
                  : "Yüksek kontrastlı, sade bir fotoğraf seçin. Mozaik uzaktan tanınır olmalı. En az 600×600 px."}
              </p>
            </div>
            {eventId ? (
              <ReferenceUpload
                eventId={eventId}
                kind={referenceKind === "foto" ? "foto" : "logo"}
                hasFile={hasReferenceFile}
                onUploaded={onUploaded}
              />
            ) : (
              // Etkinlik henüz yok: önce 2. adım onu yaratıyor
              <p className="max-w-[180px] shrink-0 text-right text-[11px] text-muted-foreground">
                Etkinlik kaydedildikten sonra yükleyebilirsin.
              </p>
            )}
          </div>

          <InfoNote className="mt-4" icon={<Info className="size-3.5" />}>
            Mozaiğin nasıl oluşacağını (3 farklı efekt) ve karo şeklini Sahne
            sayfasından seçebilirsin. Varsayılan: Kademeli Doluş.
          </InfoNote>
        </div>
      ) : (
        <InfoNote icon={<Info className="size-3.5" />}>
          Akış modunda hedef görsel yok — fotoğraflar serbest akıyor. Hangi
          düzenin kullanılacağını Sahne sayfasından seçebilirsin.
        </InfoNote>
      )}
    </div>
  );
}
