import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Landing page'e özel küçük primitive'ler.
 *
 * DİKKAT: Bunlar henüz projenin ortak design system'i DEĞİL. CLAUDE.md ortak
 * componentlerin (button/input/card/badge/modal) ekranlardan önce bitmesini ve
 * neyin ortak olacağının sorulmasını istiyor. Admin/organizatör panelleri
 * shadcn/ui üzerine kurulacağı için burayı `_components` altında, sadece bu
 * sayfaya ait tutuyorum. Ortak sete terfi kararı ayrı bir iş.
 *
 * Hover/focus/active durumları ekran görüntülerinde yok — buradakiler
 * benim koyduğum ölçülü varsayımlar, düzeltilmesi gerekebilir.
 */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "whitespace-nowrap transition-colors duration-200 " +
  "disabled:pointer-events-none disabled:opacity-45";

const buttonVariants = {
  /** Beyaz dolgulu — sayfadaki birincil eylem. */
  solid: "bg-white text-ink hover:bg-white/88 active:bg-white/78",
  /** Koyu dolgulu, ince kenarlı — ikincil. */
  dark: "bg-surface-3 text-fg border border-line hover:bg-surface-3/70 hover:border-line-strong",
  /** Neredeyse görünmez zemin — nav'daki "Giriş Yap" gibi. */
  ghost: "text-fg-muted hover:text-fg hover:bg-white/6",
} as const;

const buttonSizes = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  /** Hero'daki iri CTA — sağında yuvarlak ikon taşır. */
  lg: "h-[58px] pl-7 pr-2 text-[15px]",
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

function buttonClass({
  variant = "solid",
  size = "md",
  className = "",
}: ButtonStyleProps) {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
}

/** Bir yere götürüyorsa link, bir şey yapıyorsa button. Semantiği karıştırmıyoruz. */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonStyleProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...props
}: ButtonStyleProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}

/** "• Esnek Planlar", "En popüler", "Özelleştirme" gibi etiketler. */
export function Pill({
  children,
  className = "",
  dot = false,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium ${className}`}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-violet" />
      ) : null}
      {children}
    </span>
  );
}

/** Bölüm genişliğini tek yerden yönetiyoruz; tasarımda içerik ~1280px. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
