import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"


/**
 * Gövde yüzü. Değişken adı bilerek `--font-sans`: shadcn'in `@theme inline`
 * bloğu `font-sans` utility'sini bu değişkene bağlıyor, yani tek kaynak burası.
 * (shadcn init buraya Geist eklemişti — projenin yüzü Jakarta, geri alındı.)
 *
 * latin-ext şart: ğ ş İ ı Ö Ü karakterleri latin subset'inde yok,
 * eksik olursa Türkçe metin fallback fonta düşer.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Kurulum akışındaki altın renkli cümle değerleri için. Tasarımdaki serif
// yüzün Google Fonts'taki en yakın karşılığı — teyit edilmeli.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIXOinteractive — Etkinlikleriniz için Event Intelligence platformu",
  description:
    "MIXOinteractive, katılımcı etkileşimini artıran, kullanıcı içeriklerini yapay zekâ ile canlı dijital sanat deneyimlerine dönüştüren ve etkinlik performansını anlamlı içgörülerle analiz eden yeni nesil Event Intelligence platformudur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${playfair.variable} h-full font-sans`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
