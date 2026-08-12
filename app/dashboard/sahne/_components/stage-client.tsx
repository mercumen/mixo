"use client";

import { useState } from "react";
import { ArrowUpRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../_components/ui-bits";
import { stageTemplates } from "../../_lib/mock";
import { TemplateThumb } from "./template-thumb";

/**
 * Sahne / Önizleme.
 *
 * Buradaki önizleme YALNIZCA bir temsil — gerçek ekran uygulaması ayrı bir
 * uygulama (`/display/{kod}`, 1920x1080 sabit, Wake Lock açık). CLAUDE.md bunu
 * açıkça söylüyor: ekran, organizatör panelinin bir sekmesi değil. Bu sayfa
 * sadece şablon seçtirip nasıl görüneceğine dair fikir veriyor.
 */
export function StageClient({ eventName }: { eventName: string }) {
  const [selected, setSelected] = useState(stageTemplates[0].id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sahne / Önizleme"
        description="Büyük ekrana yansıyacak canlı mozaiğin önizlemesi"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Link2 className="size-3.5" aria-hidden="true" />
              Bağlantıyı Kopyala
            </Button>
            <Button size="sm">
              Tam Ekranda Aç
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          </>
        }
      />

      <div
        role="radiogroup"
        aria-label="Sahne şablonu"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {stageTemplates.map((t) => {
          const active = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(t.id)}
              className={cn(
                "rounded-xl border bg-card p-2 text-left transition-colors",
                active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/40",
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

      <StagePreview templateId={selected} eventName={eventName} />
    </div>
  );
}

function StagePreview({
  templateId,
  eventName,
}: {
  templateId: string;
  eventName: string;
}) {
  const template = stageTemplates.find((t) => t.id === templateId);

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
        <span className="truncate text-[11.5px] text-white/60">
          {eventName}
        </span>
      </div>

      {/* 16:9 — sahne laptopu 1920x1080 sabit çalışıyor.
          Düzen seçili şablonun diyagramından geliyor: küçük resimle önizleme
          aynı kaynağı kullanıyor, ikisi ayrışamıyor. Fotoğraflar gelince
          burası gerçek kareleri basacak. */}
      <div className="relative aspect-video w-full overflow-hidden">
        <TemplateThumb id={templateId} />
        <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-white/45">
          {template?.name} — fotoğraflar eklendiğinde burada görünecek
        </p>
      </div>
    </section>
  );
}
