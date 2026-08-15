import { createHash } from "node:crypto";

/**
 * Site kilidi — proje lansmana kadar GİZLİ.
 *
 * Tek parola tüm siteyi açıyor; hesap sistemiyle ilgisi yok. Parolayı bilen
 * tarayıcı 30 günlük bir çerez alıyor ve siteyi normal kullanıyor.
 *
 * Çerezde parolanın KENDİSİ değil, tuzlanmış SHA-256 özeti duruyor: çerez
 * sızsa bile parola sızmıyor; özet de tuz sayesinde gökkuşağı tablosuna
 * düşmüyor. Özet deterministik — proxy her istekte aynı değeri hesaplayıp
 * karşılaştırıyor, sunucuda oturum saklamak gerekmiyor.
 *
 * KALDIRIRKEN (lansman günü): bu dosya + /kilit + /api/gate + proxy'deki
 * kilit bloğu + GATE_PASSWORD env değişkenleri silinecek.
 * `docs/YAPILACAKLAR.md`'de kayıtlı.
 */

export const GATE_COOKIE = "mixo_gate";

/** Kilit çerezinin beklenen değeri; GATE_PASSWORD tanımlı değilse null (kilit kapalı). */
export function gateToken(): string | null {
  const secret = process.env.GATE_PASSWORD;
  if (!secret) return null;
  return createHash("sha256").update(`mixo-gate-v1:${secret}`).digest("hex");
}
