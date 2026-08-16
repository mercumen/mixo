/**
 * Public ortam değişkenleri — her yerde (istemci dahil) güvenle kullanılır.
 *
 * `NEXT_PUBLIC_` önekli değerler tarayıcıya gider ve gitmesi beklenir.
 * Firebase'in web config'i gizli değildir; korumayı Security Rules yapar.
 *
 * Gizli değerler için `lib/env.server.ts`'e bak — o dosya istemciden
 * import edilirse hata atar.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}\n` +
        `.env.local dosyasını kontrol et (şablon: .env.example).`,
    );
  }
  return value;
}

export const publicEnv = {
  firebase: {
    apiKey: required(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    ),
    authDomain: required(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    ),
    projectId: required(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    appId: required(
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ),
  },
  /** Misafir QR linkleri ve davet mailleri bu adrese göre üretilir. */
  appUrl: resolveAppUrl(),
} as const;

/**
 * Uygulamanın kendi adresi.
 *
 * `??` YETMİYOR: Vercel'de değişken tanımlı ama BOŞ olabiliyor (panelden
 * değer girilmeden kaydedilirse). `?? ` boş string'i yakalamıyor, adres ""
 * kalıyor ve QR'a `/e/KOD` gibi origin'siz bir metin gömülüyor — telefon
 * kamerası bunu açamıyor, hata da vermiyor. Yaşandı; o yüzden `.trim()`
 * ile boşluk da boş sayılıyor.
 *
 * Değişken hiç yoksa Vercel'in sistem değişkenlerine düşüyoruz: önce
 * projenin kalıcı production adresi, sonra o anki deploy adresi (preview
 * dağıtımları için — her deploy farklı adres alıyor, elle giremeyiz).
 * Bu bir kolaylık değil emniyet kemeri: doğru davranış `NEXT_PUBLIC_APP_URL`i
 * gerçek alan adına ayarlamak.
 */
function resolveAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;

  const production =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;

  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}
