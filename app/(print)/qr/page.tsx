import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveEvent } from "@/app/dashboard/_lib/data";
import { publicEnv } from "@/lib/env";
import { qrDataUrl } from "@/lib/qr";
import { TableCard } from "../_components/table-card";
import { PrintButton } from "../_components/print-button";

/**
 * Masa kartı baskı sayfası.
 *
 * PDF için ayrı bir kütüphane KURULMADI: tarayıcının "PDF olarak kaydet"i
 * kullanılıyor. Sebep — baskı çıktısı kalitesi tarayıcının kendi motorundan
 * daha iyi çıkıyor (vektör metin, doğru DPI) ve bir bağımlılık eksik kalıyor.
 *
 * Sayfa kesin ölçülerle basılıyor (bkz. `@page` kuralı); ekrandaki kontroller
 * `print:hidden` ile çıktıdan düşüyor.
 */
export default async function QrPrintPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const event = await getActiveEvent(user.uid);
  if (!event) redirect("/dashboard");

  const dataUrl = await qrDataUrl(event.code);
  // Kartta yazılı görünen adres — protokolü göstermiyoruz, elle yazılacak
  const shortUrl = `${publicEnv.appUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/e/${event.code}`;

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-10">
      <div className="w-full print:hidden">
        <h1 className="text-[17px] font-semibold tracking-tight">
          Masa Kartı Baskısı
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600">
          Yazdır penceresinde <strong>&ldquo;PDF olarak kaydet&rdquo;</strong>{" "}
          seçeneğini kullanabilirsin. Matbaaya göndereceksen kenar boşluklarını
          kapatma — karekodun çevresindeki beyaz alan okunurluk için gerekli.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      <div className="mt-8 print:mt-0">
        <TableCard
          eventName={event.name}
          code={event.code}
          shortUrl={shortUrl}
          qrDataUrl={dataUrl}
        />
      </div>
    </div>
  );
}
