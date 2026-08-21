import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { Pricing } from "./_components/pricing";
import { Viral } from "./_components/viral";

/**
 * Landing page. Bölüm sırası:
 * hero → özellikler → viral/kapanış → paketler.
 *
 * Paketler EN SONDA: ziyaretçi önce ürünün ne yaptığını görüyor,
 * fiyat/paket konuşması sayfanın kapanışı.
 *
 * Tamamı Server Component; sayfada state yok, "use client" gerekmiyor.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Viral />
      <Pricing />
    </>
  );
}
