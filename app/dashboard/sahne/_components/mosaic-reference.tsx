"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  referenceKinds,
  referenceShapes,
  type ReferenceKind,
} from "@/lib/stage-templates";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../../_components/ui-bits";

/**
 * Mozaik Referansı — misafir fotoğraflarının birleşip oluşturacağı hedef görsel.
 *
 * Üç kaynak: hazır şekil, kurumsal logo, referans fotoğraf. Tasarımda üçü
 * sekme olarak duruyor ve tek seçim yapılıyor.
 *
 * Yükleme R2'ye gidiyor (presigned PUT) — dosya sunucudan geçmiyor.
 * Bu tur sadece seçim kaydediliyor; dosya yükleme bağlanınca `onUpload`
 * doldurulacak.
 */
export function MosaicReference({
  kind,
  shape,
  hasFile,
  onKindChange,
  onShapeChange,
  disabled,
}: {
  kind: ReferenceKind;
  shape: string | null;
  hasFile: boolean;
  onKindChange: (kind: ReferenceKind) => void;
  onShapeChange: (shape: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-primary/35 bg-accent/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          title="Mozaik Referansı"
          description="Misafir fotoğrafları birleşip hangi görseli oluşturacağını seçin: hazır bir şekil, kurumsal logonuz ya da bir referans fotoğrafı."
        />

        {/* Sekmeler — tek seçim */}
        <div
          role="radiogroup"
          aria-label="Referans türü"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1"
        >
          {referenceKinds.map((k) => (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={kind === k.id}
              disabled={disabled}
              onClick={() => onKindChange(k.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                kind === k.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {kind === "sekil" ? (
          <div
            role="radiogroup"
            aria-label="Hazır şekil"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {referenceShapes.map((sh) => (
              <button
                key={sh.id}
                type="button"
                role="radio"
                aria-checked={shape === sh.id}
                disabled={disabled}
                onClick={() => onShapeChange(sh.id)}
                className={cn(
                  "rounded-xl border bg-card px-4 py-4 text-[12.5px] font-medium transition-colors",
                  shape === sh.id
                    ? "border-primary ring-1 ring-primary text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {sh.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent">
              <Upload className="size-4 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">
                {kind === "logo"
                  ? "Kurumsal logonuzu yükleyin"
                  : "Referans fotoğrafı yükleyin"}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {kind === "logo"
                  ? "Şeffaf zeminli PNG önerilir — logonun dolu alanları mozaiğin şeklini belirler. En az 600×600 px."
                  : "Yüksek kontrastlı, sade bir fotoğraf seçin. Mozaik uzaktan bakıldığında tanınır olmalı. En az 600×600 px."}
              </p>
              {hasFile ? (
                <p className="mt-1.5 text-[11px] font-medium text-primary">
                  Dosya yüklendi
                </p>
              ) : null}
            </div>
            {/* Yükleme R2'ye presigned PUT ile gidecek; henüz bağlanmadı */}
            <Button size="sm" disabled className="shrink-0">
              Dosya Seç
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
