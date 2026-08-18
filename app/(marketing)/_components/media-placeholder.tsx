/**
 * GEÇİCİ — görsellerin geleceği yerleri tutar.
 *
 * Tasarımdaki her fotoğraf/3D render bu componentle temsil ediliyor.
 * Görseller elime geçtiğinde her kullanım `next/image` ile değiştirilecek;
 * `label` prop'u hangi kutuya ne geleceğini söylüyor.
 *
 * Kasten göze çarpıyor: kesikli kenarlık + etiket. Boş kutu sanılmasın.
 */

import Image from "next/image";
import type { ComponentProps } from "react";

type MediaPlaceholderProps = ComponentProps<"div"> & {
  /** Bu kutuya hangi görsel gelecek. Ekranda küçük puntoyla görünür. */
  label: string;
  /** `aspect-*` sınıfı ya da sabit yükseklik; boyutu çağıran belirler. */
  className?: string;
};

export function MediaPlaceholder({
  label,
  className = "",
  ...props
}: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Görsel yer tutucu: ${label}`}
      className={`relative flex items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-line-strong bg-white/3 ${className}`}
      {...props}
    >
      {/* Boş alanı okunur kılan ince çapraz tarama */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 9px)",
        }}
      />
      <span className="relative px-3 text-center text-[10px] leading-tight font-medium tracking-wide text-fg-subtle uppercase">
        {label}
      </span>
    </div>
  );
}

/**
 * Hero'da savrulmuş duran polaroid kareler. Beyaz çerçeve + döndürme
 * tasarımdan; içi yine yer tutucu.
 */
type PolaroidProps = ComponentProps<"div"> & {
  label: string;
  /** Gerçek görsel geldiyse yolu; yoksa yer tutucu çiziliyor. */
  src?: string;
  className?: string;
};

export function PolaroidPlaceholder({
  label,
  src,
  className = "",
  ...props
}: PolaroidProps) {
  return (
    <div
      className={`rounded-[6px] bg-white p-[6px] pb-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)] ${className}`}
      {...props}
    >
      {src ? (
        /**
         * Polaroid süsleri DEKORATİF: kapsayıcıları `aria-hidden`, o yüzden
         * alt metni boş. Ekran okuyucuya anlatacak bir şey yok.
         *
         * `sizes` küçük: bunlar 52-135px arası minik kareler, tarayıcının
         * gereksiz büyük varyant indirmesinin anlamı yok.
         */
        <Image
          src={src}
          alt=""
          width={560}
          height={560}
          sizes="200px"
          className="size-full rounded-[3px] object-cover"
        />
      ) : (
        <MediaPlaceholder
          label={label}
          className="size-full min-h-14 rounded-[3px] border-black/15 bg-black/6"
        />
      )}
    </div>
  );
}
