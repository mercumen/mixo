import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * E-posta kayıtlı mı? Akış buna göre "giriş" ya da "kayıt" koluna ayrılıyor.
 *
 * Neden sunucuda: istemci SDK'sındaki `fetchSignInMethodsForEmail`, Firebase'in
 * varsayılan açık olan "Email Enumeration Protection" ayarı yüzünden artık
 * boş dönüyor. Güvenilir cevap Admin SDK'dan geliyor.
 *
 * ⚠️ BU ENDPOINT KULLANICI NUMARALANDIRMAYA AÇIK: art arda çağırıp hangi
 * e-postaların kayıtlı olduğunu çıkarmak mümkün. Tasarım bu ayrımı açıkça
 * istiyor (iki farklı ekran: "Aramıza Hoş Geldiniz" / "Tekrar Hoş Geldiniz"),
 * o yüzden şimdilik böyle. Canlıya çıkmadan önce en az hız sınırı konmalı.
 */
export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (typeof email !== "string" || email.trim().length === 0) {
    return Response.json({ error: "E-posta gerekli." }, { status: 400 });
  }

  try {
    await getAdminAuth().getUserByEmail(email.trim().toLowerCase());
    return Response.json({ exists: true });
  } catch (error) {
    // user-not-found beklenen durum: yeni kullanıcı, kayıt koluna gidecek
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/user-not-found"
    ) {
      return Response.json({ exists: false });
    }
    // Geçersiz e-posta biçimi de buraya düşer; kayıt kolu zaten doğrulayacak
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/invalid-email"
    ) {
      return Response.json({ error: "Geçersiz e-posta." }, { status: 400 });
    }

    console.error("check-email başarısız:", error);
    return Response.json(
      { error: "Kontrol edilemedi, tekrar deneyin." },
      { status: 500 },
    );
  }
}
