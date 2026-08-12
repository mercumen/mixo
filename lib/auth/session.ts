import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { paths, type UserDoc } from "@/lib/schema";

/**
 * Sunucu tarafı oturum.
 *
 * NEDEN ÇEREZ: Firebase istemci SDK'sı oturumu IndexedDB'de tutuyor — yani
 * sunucu kimin giriş yaptığını bilmiyor. Sadece istemcide kontrol edersek
 * "koruma" görsel olur: HTML yine servis edilir, panel bir an görünür.
 *
 * Bu yüzden girişten sonra istemci ID token'ını /api/auth/session'a gönderiyor,
 * sunucu bunu httpOnly bir Firebase session çerezine çeviriyor. Böylece
 * layout'lar ve route handler'lar isteği gerçekten reddedebiliyor.
 *
 * NOT: Bu çerez Admin SDK ile doğrulanıyor, Admin SDK de Node runtime
 * istiyor. O yüzden kontrol Edge middleware'de değil, Server Component
 * içinde yapılıyor.
 */

export const SESSION_COOKIE = "mixo_session";

/** Firebase session çerezi en fazla 14 gün yaşayabiliyor; 5 gün seçtim. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export type CurrentUser = UserDoc;

/**
 * Giriş yapmış kullanıcı, yoksa null.
 *
 * `cache` ile sarılı: aynı istek içinde layout + sayfa + component'ler
 * çağırsa bile Firestore'a bir kez gidiyor.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    // true → iptal/silinmiş kullanıcı kontrolü de yapılıyor. Hesabı kapatılan
    // birinin çerezi elinde kalmasın.
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );

    const snap = await getDb().doc(paths.user(decoded.uid)).get();
    if (!snap.exists) return null;

    return snap.data() as UserDoc;
  } catch {
    // Süresi geçmiş / bozuk / iptal edilmiş çerez → giriş yapılmamış sayılıyor
    return null;
  }
});
