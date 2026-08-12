import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panelde tekrar eden küçük düzen parçaları. shadcn componentlerinin
 * üstünde ince bir katman — ekranlar arası tutarlılık için.
 */

/** Sayfa başlığı + açıklama, sağında eylemler. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-[12.5px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Sayı gösteren küçük kutu. Görevler / Canlı Akış / Galeri'de aynı. */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Değeri markanın moruyla vurgular (ör. onay bekleyen sayısı) */
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="text-[11.5px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[22px] leading-none font-semibold tracking-tight",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Kart içindeki başlık bloğu (başlık + tek satır açıklama). */
export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Mor sol kenarlı bilgi şeridi — tasarımda birkaç yerde geçiyor. */
export function InfoNote({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg bg-accent/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-foreground/80",
        className,
      )}
    >
      {icon ? (
        <span className="mt-px shrink-0 text-primary" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
