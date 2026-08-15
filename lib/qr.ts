import "server-only";

import QRCode from "qrcode";
import { publicEnv } from "@/lib/env";

/**
 * Etkinlik QR kodu.
 *
 * SUNUCUDA üretiliyor: `qrcode` paketi istemci paketine girmiyor ve misafir
 * adresi tek yerden türetiliyor.
 *
 * BASKI İÇİN ÖNEMLİ AYARLAR:
 *
 * `errorCorrectionLevel: "H"` — en yüksek hata düzeltme (%30). Basılı kod
 * kırışıyor, üstüne bardak konuyor, ışık yansıması oluyor; masadaki kart
 * kusursuz kalmıyor. "H" kodun üçte biri bozulsa bile okunmasını sağlıyor.
 * Ayrıca ortasına logo koymak kodun bir kısmını kapatıyor — "H" onu da tolere
 * ediyor. Düşük seviyede (L/M) logo eklemek kodu okunamaz yapardı.
 *
 * `margin: 2` — sessiz bölge. Kenardan taşan tasarımlarda okuyucu kodu
 * bulamıyor, bu boşluk şart.
 */

const QR_OPTIONS = {
  errorCorrectionLevel: "H" as const,
  margin: 2,
  color: { dark: "#000000", light: "#FFFFFF" },
};

/** Misafirin QR'ı okuttuğunda gideceği adres. */
export function guestUrl(code: string) {
  return `${publicEnv.appUrl.replace(/\/+$/, "")}/e/${code}`;
}

/**
 * Baskı için SVG. Vektör olduğu için matbaada ölçek kaybı yok —
 * PNG'yi büyütmek kenarları bozar, SVG bozmaz.
 */
export async function qrSvg(code: string): Promise<string> {
  return QRCode.toString(guestUrl(code), { ...QR_OPTIONS, type: "svg" });
}

/**
 * Ekranda gösterim ve canvas'a çizim için data URL.
 *
 * `width: 1024` — logo eklemek ve PNG indirmek için canvas'a çizilecek;
 * küçük üretip büyütmek bulanıklaştırıyor.
 */
export async function qrDataUrl(code: string, width = 1024): Promise<string> {
  return QRCode.toDataURL(guestUrl(code), { ...QR_OPTIONS, width });
}

/**
 * Şeffaf zeminli SVG — "Sadece QR Kodu" seçeneği.
 *
 * Tasarım "şeffaf zeminli" diyor: organizatör kendi davetiyesine gömecek.
 * `qrcode` şeffaf zemin seçeneği vermediği için beyaz dolguyu SVG'den
 * çıkarıyoruz. Kod kareleri siyah kalıyor.
 *
 * UYARI: şeffaf zemin koyu arka plana konursa kod okunmaz olur — kontrast
 * gerektiği notu arayüzde kullanıcıya söyleniyor.
 */
export async function qrTransparentSvg(code: string): Promise<string> {
  const svg = await qrSvg(code);
  return svg.replace(/<path[^>]*fill="#FFFFFF"[^>]*\/>/gi, "");
}
