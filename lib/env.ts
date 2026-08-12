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
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
