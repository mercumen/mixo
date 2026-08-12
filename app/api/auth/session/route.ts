import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

/**
 * Oturum çerezi kur (giriş) ve sil (çıkış).
 *
 * POST   → ID token'ı doğrula, httpOnly session çerezi yaz
 * DELETE → çerezi sil
 */

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!idToken) {
    return Response.json({ error: "Token gerekli." }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();

    // createSessionCookie token'ı zaten doğruluyor ama açıkça doğrulayıp
    // hata mesajını ayırmak istiyorum (süresi geçmiş token vs. geçersiz token).
    await auth.verifyIdToken(idToken);

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true, // JS okuyamaz → XSS ile çalınamaz
      secure: process.env.NODE_ENV === "production", // localhost http olduğu için dev'de kapalı
      sameSite: "lax", // Google popup dönüşü ve normal gezinme çalışsın
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("oturum kurulamadı:", error);
    return Response.json({ error: "Oturum kurulamadı." }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
