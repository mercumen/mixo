"use client";

import { useState } from "react";
import { Info, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { missionTones } from "@/lib/mission-tones";
import { cn } from "@/lib/utils";
import { InfoNote } from "../ui-bits";

/**
 * Sihirbaz adımı — Görev Havuzu.
 *
 * PAKETE GÖRE İKİ AYRI EKRAN:
 *
 *   Essential    → AI yok. Etkinlik türüne göre hazır görevler zaten
 *                  kopyalanmış durumda; organizatör bunları Görevler
 *                  sayfasından düzenliyor. Bu adım sadece bilgilendiriyor.
 *                  (Türe göre değişen "klasik sorular" sonra eklenecek.)
 *
 *   Üst paketler → AI formu: kişi/kurum adı, ton, tema, özel bilgiler.
 *                  AI bu girdilerle etkinliğe özel görev yazıyor.
 */

export type MissionValues = {
  subject: string;
  tone: string;
  theme: string;
  facts: string[];
};

const MAX_FACTS = 10;

export function StepMissions({
  planId,
  values,
  missionCount,
  onChange,
  disabled,
}: {
  planId: string | null;
  values: MissionValues;
  /** Etkinlik yaratılırken kopyalanan hazır görev sayısı */
  missionCount: number;
  onChange: (patch: Partial<MissionValues>) => void;
  disabled?: boolean;
}) {
  // AI görev üretimi üst paketlerin özelliği (pricing'de "Kişiselleştirilmiş
  // Yapay Zekâ Görevleri" Professional'dan itibaren yazıyor)
  const aiEnabled = planId !== "essential";

  if (!aiEnabled) {
    return <ManualMissions missionCount={missionCount} />;
  }

  return (
    <AiMissions
      values={values}
      onChange={onChange}
      disabled={disabled}
      missionCount={missionCount}
    />
  );
}

/** Essential: hazır görevler kopyalanmış, düzenleme Görevler sayfasında. */
function ManualMissions({ missionCount }: { missionCount: number }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[13px] font-semibold">
          Etkinlik türünüze uygun {missionCount} görev hazır
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Görevler etkinlik türünüze göre otomatik yüklendi. Hangilerinin
          misafirlere gideceğini <strong className="font-semibold">Görevler</strong>{" "}
          sayfasından açıp kapatabilir, kendi görevlerinizi de ekleyebilirsiniz.
        </p>
      </div>

      <InfoNote icon={<Sparkles className="size-3.5" />}>
        Yapay zekâ ile etkinliğinize özel görev üretimi{" "}
        <strong className="font-semibold">Professional</strong> paketinde
        açılıyor. AI, konseptinize ve misafirlerinize göre görev yazıyor.
      </InfoNote>
    </div>
  );
}

/** Üst paketler: AI'ın görev yazması için gereken girdiler. */
function AiMissions({
  values,
  onChange,
  disabled,
  missionCount,
}: {
  values: MissionValues;
  onChange: (patch: Partial<MissionValues>) => void;
  disabled?: boolean;
  missionCount: number;
}) {
  const [factInput, setFactInput] = useState("");

  function addFact(raw: string) {
    const fact = raw.trim();
    if (!fact || values.facts.length >= MAX_FACTS) return;
    // Aynı bilgi iki kez eklenmesin
    if (values.facts.some((f) => f.toLowerCase() === fact.toLowerCase())) {
      setFactInput("");
      return;
    }
    onChange({ facts: [...values.facts, fact] });
    setFactInput("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="m-subject" className="text-[11.5px] font-normal">
          Kişi / Kurum Adı
        </Label>
        <Input
          id="m-subject"
          value={values.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Örn. Ayşe & Mehmet, Acme Corp vb."
          maxLength={80}
          disabled={disabled}
        />
        <p className="text-[11px] text-muted-foreground">
          AI görevlerde bu ismi doğrudan kullanacak
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11.5px] text-muted-foreground">Görev Tonu</p>
        <div
          role="radiogroup"
          aria-label="Görev tonu"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {missionTones.map((tone) => {
            const selected = values.tone === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onChange({ tone: tone.id })}
                className={cn(
                  "rounded-xl border bg-card px-3.5 py-3 text-left transition-colors",
                  selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles
                    className={cn("size-3.5", tone.accent)}
                    aria-hidden="true"
                  />
                  <span className="text-[12.5px] font-semibold">
                    {tone.label}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                  {tone.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-theme" className="text-[11.5px] font-normal">
          Tema / Konsept{" "}
          <span className="text-muted-foreground">• (opsiyonel)</span>
        </Label>
        <Input
          id="m-theme"
          value={values.theme}
          onChange={(e) => onChange({ theme: e.target.value })}
          placeholder="Örn. 30. yaş doğum günü, Yıldönümü balosu vb."
          maxLength={80}
          disabled={disabled}
        />
        <p className="text-[11px] text-muted-foreground">
          AI görevlerde bu temayı doğrudan kullanacak
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-fact" className="text-[11.5px] font-normal">
          Özel Bilgiler{" "}
          <span className="text-muted-foreground">
            • görev kalitesini en çok bu belirler
          </span>
        </Label>
        <Input
          id="m-fact"
          value={factInput}
          onChange={(e) => {
            // Virgülle yazınca anında etiket oluyor
            if (e.target.value.includes(",")) {
              e.target.value.split(",").forEach(addFact);
              return;
            }
            setFactInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Formu göndermesin, etiket eklesin
              e.preventDefault();
              addFact(factInput);
            }
          }}
          placeholder="Örn. Kahve Tutkusu"
          maxLength={60}
          disabled={disabled || values.facts.length >= MAX_FACTS}
        />
        <p className="text-[11px] text-muted-foreground">
          &ldquo;,&rdquo; (virgül) veya enter tuşuna basarak yenilerini
          ekleyebilirsin.
        </p>

        {values.facts.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {values.facts.map((fact) => (
              <li key={fact}>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-accent/50 py-1 pr-1.5 pl-2.5 text-[11.5px]">
                  {fact}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onChange({ facts: values.facts.filter((f) => f !== fact) })
                    }
                    aria-label={`Kaldır: ${fact}`}
                    className="grid size-4 place-items-center rounded text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <InfoNote icon={<Info className="size-3.5" />}>
        Etkinlik türünüze göre {missionCount} hazır görev zaten yüklendi. AI
        ürettiği görevleri bunlara ekleyecek ve hepsi{" "}
        <strong className="font-semibold">onayınıza</strong> düşecek — misafire
        siz onaylamadan gitmiyor.
      </InfoNote>
    </div>
  );
}
