/**
 * MIXOinteractive kelime markası.
 *
 * Hem pazarlama nav'ında hem kurulum akışında geçiyor, o yüzden ortak.
 * Gerçek logo SVG'si geldiğinde değişecek tek yer burası.
 */

const sizes = {
  sm: "text-[13px]",
  md: "text-lg",
  lg: "text-xl",
} as const;

export function Wordmark({
  size = "md",
  className = "",
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={`leading-none whitespace-nowrap ${sizes[size]} ${className}`}
    >
      {/* Renk yok — currentColor'ı miras alıyor. Koyu pazarlama sitesinde de
          açık temalı organizatör panelinde de aynı component kullanılıyor. */}
      <span className="font-extrabold tracking-[0.14em]">MIXO</span>
      <span className="font-medium tracking-tight opacity-85">interactive</span>
    </span>
  );
}
