import type { ReactNode } from "react";
import { SiteFooter } from "./_components/site-footer";
import { SiteNav } from "./_components/site-nav";

/**
 * Pazarlama sitesi layout'u.
 *
 * Route group `(marketing)` URL'e girmiyor — bu layout sadece public sayfaları
 * sarıyor. /admin, /dashboard, /e/{kod} ve /display/{kod} kendi layout'larıyla
 * gelecek; nav'ı buraya koymamızın sebebi o dördüne sızmaması.
 *
 * Footer bu layout'ta: pazarlama sayfalarında görünüyor, kurulum akışında
 * görünmüyor (orada kendi ince bağlantı şeridi var).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* Mor/magenta ambiyans — iki katman, ikisi de burada.
          Section'ların içinde DEĞİL: hepsinde `overflow-hidden` var (polaroid'ler
          taşabilsin diye), içeride kalan gradient kenarda kesilip bant yapıyordu.
          Negatif z-index yok — içerik `relative` ile üstte kalıyor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Sayfa geneli, yüksekliğe oranlı */}
        <div className="glow-page absolute inset-0" />
        {/* Hero + header. Sabit px yükseklik: sayfa uzasa da tepedeki ışıma
            kaymaz. inset-x-0 top-0 olduğu için nav şeridinin arkasını da
            kaplıyor — header hizasındaki kesik böyle kalkıyor. */}
        <div className="glow-hero absolute inset-x-0 top-0 h-[1250px]" />
      </div>
      <SiteNav />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
