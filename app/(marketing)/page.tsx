import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { Pricing } from "./_components/pricing";
import { Viral } from "./_components/viral";

/**
 * Landing page. Ekran görüntülerindeki 4 bölümün sırası:
 * hero → paketler → özellikler → viral/kapanış.
 *
 * Tamamı Server Component; sayfada state yok, "use client" gerekmiyor.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Pricing />
      <Features />
      <Viral />
    </>
  );
}
