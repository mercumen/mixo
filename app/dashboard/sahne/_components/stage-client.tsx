"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Link2, Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventDoc } from "@/lib/schema";
import {
  findStageTemplate,
  isTemplateAllowed,
  lockedTemplatesForPlan,
  needsReference,
  templatesForPlan,
  type ReferenceKind,
} from "@/lib/stage-templates";
import { cn } from "@/lib/utils";
import { InfoNote, PageHeader } from "../../_components/ui-bits";
import { MosaicReference } from "./mosaic-reference";
import { TemplateThumb } from "./template-thumb";

/**
 * Sahne / Önizleme.
 *
 * ŞABLONLAR PAKETE GÖRE FİLTRELİ ve kısıt kapsayan değil ayıran:
 * Essential bir grubu, Professional/Enterprise bambaşka bir grubu görüyor.
 * Kaynak: lib/stage-templates.ts
 *
 * Buradaki önizleme YALNIZCA temsil — gerçek ekran ayrı bir uygulama
 * (`/display/{kod}`, 1920x1080, Wake Lock açık). CLAUDE.md bunu açıkça
 * söylüyor: ekran, organizatör panelinin bir sekmesi değil.
 */
export function StageClient({ event }: { event: EventDoc }) {
  const router = useRouter();
  const available = templatesForPlan(event.planId);

  const [selected, setSelected] = useState<string | null>(
    event.stageTemplateId,
  );
  const [kind, setKind] = useState<ReferenceKind>(
    event.stageReferenceKind ?? "sekil",
  );
  const [shape, setShape] = useState<string | null>(event.stageReferenceShape);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Kayıtlı şablon paketle uyuşmuyor mu?
   * Paket değişince olabiliyor (Essential → Professional). Sessizce bozuk bir
   * sahneyle canlıya çıkmasın diye uyarıyoruz.
   */
  const savedButBlocked =
    event.stageTemplateId !== null &&
    !isTemplateAllowed(event.stageTemplateId, event.planId);

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Kaydedilemedi.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  function pickTemplate(id: string) {
    setSelected(id);
    void save({ stageTemplateId: id });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sahne / Önizleme"
        description="Büyük ekrana yansıyacak canlı mozaiğin önizlemesi"
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              <Link2 className="size-3.5" aria-hidden="true" />
              Bağlantıyı Kopyala
            </Button>
            <Button size="sm" disabled>
              Tam Ekranda Aç
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          </>
        }
      />

      {/* Paket henüz seçilmemiş: liste daralacak, kullanıcı bilsin */}
      {!event.planId ? (
        <InfoNote icon={<TriangleAlert className="size-3.5" />}>
          Paket henüz seçilmedi. Kullanılabilir sahne şablonları pakete göre
          değişiyor — paketi seçtikten sonra bu listeyi tekrar kontrol edin.
        </InfoNote>
      ) : null}

      {savedButBlocked ? (
        <InfoNote
          icon={<TriangleAlert className="size-3.5" />}
          className="bg-destructive/10 text-foreground"
        >
          Daha önce seçtiğiniz{" "}
          <strong className="font-semibold">
            {findStageTemplate(event.stageTemplateId)?.name}
          </strong>{" "}
          şablonu mevcut paketinizde yok. Aşağıdan yeni bir şablon seçin.
        </InfoNote>
      ) : null}

      <div
        role="radiogroup"
        aria-label="Sahne şablonu"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {available.map((t) => {
          const active = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={busy}
              onClick={() => pickTemplate(t.id)}
              className={cn(
                "rounded-xl border bg-card p-2 text-left transition-colors",
                active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/40",
                busy && "opacity-70",
              )}
            >
              <div className="h-[92px]">
                <TemplateThumb id={t.id} />
              </div>
              <p className="mt-2.5 px-1 text-[12.5px] font-semibold">{t.name}</p>
              <p className="mt-0.5 px-1 pb-1 text-[11px] text-muted-foreground">
                {t.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Kilitli liste ASİMETRİK: Essential üsttekileri görüyor (yükseltme
          daveti), üst paket Essential'dakileri hiç görmüyor. */}
      <LockedTemplates planId={event.planId} />

      {/* Referans sadece hedef görsel oluşturan şablonlarda anlamlı */}
      {needsReference(selected) ? (
        <MosaicReference
          kind={kind}
          shape={shape}
          hasFile={event.stageReferenceKey !== null}
          disabled={busy}
          onKindChange={(k) => {
            setKind(k);
            void save({ stageReferenceKind: k });
          }}
          onShapeChange={(sh) => {
            setShape(sh);
            void save({ stageReferenceShape: sh, stageReferenceKind: "sekil" });
          }}
        />
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive"
        >
          {error}
        </p>
      ) : null}

      <StagePreview event={event} templateId={selected} />
    </div>
  );
}

/**
 * Kilitli şablonlar — sadece Essential'a gösteriliyor.
 * Üst paketler için `lockedTemplatesForPlan` boş dizi dönüyor, bölüm hiç
 * basılmıyor.
 */
function LockedTemplates({ planId }: { planId: string | null }) {
  const locked = lockedTemplatesForPlan(planId);
  if (locked.length === 0) return null;

  return (
    <div>
      <p className="text-[11.5px] text-muted-foreground">
        Üst paketlerde açılan şablonlar
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {locked.map((t) => (
          <div
            key={t.id}
            aria-disabled="true"
            className="rounded-xl border border-border bg-card p-2 opacity-55"
          >
            <div className="relative h-[92px]">
              <TemplateThumb id={t.id} />
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/45">
                <Lock className="size-4 text-white/90" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2.5 px-1 text-[12.5px] font-semibold">{t.name}</p>
            <p className="mt-0.5 px-1 pb-1 text-[11px] text-muted-foreground">
              {t.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StagePreview({
  event,
  templateId,
}: {
  event: EventDoc;
  templateId: string | null;
}) {
  const template = findStageTemplate(templateId);

  return (
    <section
      aria-label="Canlı önizleme"
      className="overflow-hidden rounded-2xl border border-border bg-[#0b0a10]"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-white/80 uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-violet-400" />
          Canlı Önizleme
        </span>
        <span aria-hidden="true" className="text-white/25">
          ·
        </span>
        <span className="truncate text-[11.5px] text-white/60">{event.name}</span>
      </div>

      {/* 16:9 — sahne laptopu 1920x1080 sabit çalışıyor */}
      <div className="relative aspect-video w-full overflow-hidden">
        {templateId ? (
          <>
            <TemplateThumb id={templateId} />
            <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-white/45">
              {template?.name} — fotoğraflar eklendiğinde burada görünecek
            </p>
          </>
        ) : (
          <div className="grid size-full place-items-center bg-[#0d0b14]">
            <p className="text-[12px] text-white/50">
              Yukarıdan bir sahne şablonu seçin
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
