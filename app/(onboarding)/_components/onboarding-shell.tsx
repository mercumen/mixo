import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Wordmark } from "@/app/_components/wordmark";

/**
 * Kurulum ve giriş ekranlarının ortak çerçevesi: ışıma, sol üstteki logo,
 * ortalanmış içerik ve alt bağlantılar.
 *
 * `accent` seçilen etkinlik türünden gelir ve `--accent` custom property'sine
 * yazılır; `glow-onboarding` rengini oradan okuyor. Böylece tür değişince
 * sayfanın tonu da değişiyor.
 */
export function OnboardingShell({
  accent,
  headerRight,
  footer = true,
  children,
}: {
  accent?: string;
  headerRight?: ReactNode;
  footer?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      /* flex-1: iç içe `min-h-full` yüzdesi zincirlenmiyor (ara div'in
         yüksekliği auto olunca çözülmüyor), o yüzden büyüterek dolduruyoruz.
         İçeriğin dikeyde ortalanması buna bağlı. */
      className="relative flex min-h-full flex-1 flex-col"
      style={
        {
          /* Tür seçilmeden önce de bir değer olmalı: `var(--accent)` boşta
             kalırsa nokta/chip renkleri geçersiz olup görünmez oluyor. */
          "--accent": accent ?? "var(--color-violet)",
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="glow-onboarding pointer-events-none absolute inset-0 transition-[background-image] duration-700"
      />

      <header className="relative flex items-center justify-between gap-4 px-5 py-6 sm:px-9">
        <Link href="/" aria-label="MIXOinteractive ana sayfa">
          <Wordmark size="sm" />
        </Link>
        {headerRight}
      </header>

      {/* Dikeyde ortalı ama uzun içerikte taşmıyor */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        {children}
      </main>

      {footer ? (
        <footer className="relative px-5 pb-8 sm:px-9">
          <ul className="flex items-center justify-center gap-3 text-[11px] text-fg-subtle">
            {[
              { label: "Instagram", href: "#instagram" },
              { label: "LinkedIn", href: "#linkedin" },
              { label: "Bize Ulaşın", href: "#iletisim" },
            ].map(({ label, href }, i) => (
              <li key={href} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-fg-subtle/50">
                    |
                  </span>
                ) : null}
                <Link
                  href={href}
                  className="transition-colors duration-200 hover:text-fg-muted"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      ) : (
        // Footer'sız ekranlarda da dikey denge bozulmasın
        <div aria-hidden="true" className="pb-8" />
      )}
    </div>
  );
}
