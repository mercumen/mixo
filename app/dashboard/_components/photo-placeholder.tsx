import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo } from "../_lib/mock";

/**
 * GEÇİCİ — misafir fotoğraflarının yeri.
 *
 * Pazarlama sitesindeki yer tutucudan ayrı: bu açık temada duruyor ve oran
 * bilgisini `Photo.ratio`'dan alıyor, böylece masonry düzeni gerçek
 * fotoğraflar gelmeden de doğru görünüyor.
 *
 * Gerçek hâlinde `next/image` + R2'deki imzalı URL olacak. R2 objelerinde
 * `Cache-Control: public, max-age=31536000, immutable` bekleniyor
 * (CLAUDE.md kural 7) — bu yüzden `unoptimized` yerine normal loader.
 */

const ratioClass: Record<Photo["ratio"], string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
};

export function PhotoPlaceholder({
  ratio = "landscape",
  className,
  label,
}: {
  ratio?: Photo["ratio"];
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label ? `Fotoğraf yer tutucu: ${label}` : "Fotoğraf yer tutucu"}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted",
        ratioClass[ratio],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 10px)",
        }}
      />
      <ImageIcon
        className="relative size-5 text-muted-foreground/50"
        aria-hidden="true"
      />
    </div>
  );
}
