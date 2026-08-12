import "server-only";

import { getDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/schema";

/**
 * Etkinlik kodu üretimi. SUNUCUDA — istemci kod uydurmaz.
 *
 * Bu kod hem URL'de (`/e/A7K2M9`) hem de masa kartında basılı olarak
 * kullanılacak. QR okunmayan telefonlarda misafir bunu ELLE yazacak, o yüzden:
 *
 *   - Karıştırılan karakterler alfabede YOK: 0/O, 1/I/L
 *   - Hepsi büyük harf, girişte normalize edilecek
 *   - 6 karakter: 31^6 ≈ 887 milyon kombinasyon, çakışma pratikte yok
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function randomCode(): string {
  // crypto: Math.random tahmin edilebilir; kod URL'de yetki taşıdığı için
  // (kodu bilen misafir akışına girebiliyor) rastgeleliği ciddiye alıyoruz.
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/**
 * Kullanılmayan bir kod döndürür.
 *
 * Çakışma kontrolü tek alan eşitliği (`code == X`) olduğu için bileşik indeks
 * gerekmiyor — Firestore tek alan indekslerini kendisi kuruyor.
 */
export async function generateUniqueEventCode(attempts = 5): Promise<string> {
  const db = getDb();

  for (let i = 0; i < attempts; i++) {
    const code = randomCode();
    const existing = await db
      .collection(paths.events)
      .where("code", "==", code)
      .limit(1)
      .get();

    if (existing.empty) return code;
  }

  // 887 milyonda 5 kez üst üste çakışma gerçekçi değil; buraya düşülüyorsa
  // sorun rastgelelikte değil, sessizce yutmak yerine bağıralım.
  throw new Error(
    "Etkinlik kodu üretilemedi: üst üste çakışma. Alfabe/uzunluk kontrol edilmeli.",
  );
}
