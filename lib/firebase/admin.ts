import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { serverEnv } from "@/lib/env.server";

/**
 * Firebase Admin SDK — sunucu tarafı.
 *
 * Bu SDK Security Rules'ı BYPASS eder; tam yetkili. O yüzden sadece
 * doğruladığımız isteklerde kullanılıyor, asla istemciye açık bir yoldan
 * çağrılmıyor.
 *
 * Firestore'a yazan TEK yer burası olacak: misafir de organizatör de
 * doğrudan yazmıyor, endpoint'lerden geçiyor (bkz. Security Rules).
 *
 * Tembel başlatma: modül import edildiği anda değil, ilk kullanımda kurulur.
 * Böylece Firebase anahtarı olmayan bir ortamda (ör. sadece pazarlama
 * sayfasını build ederken) gereksiz yere patlamıyor.
 */

let cachedApp: App | undefined;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  // Next dev modunda modüller yeniden yükleniyor; aynı isimde ikinci app
  // yaratmak hata verir, o yüzden mevcut olanı tekrar kullanıyoruz.
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const { projectId, clientEmail, privateKey } = serverEnv.firebase;

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  return cachedApp;
}

export function getDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
