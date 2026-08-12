import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { paths, type UserDoc } from "@/lib/schema";

/**
 * Giriş/kayıt sonrası kullanıcı dokümanını hazırlar.
 *
 * İstemci Firebase Auth'ta hesabı kendisi açıyor (o Auth, Firestore değil),
 * sonra ID token'ıyla buraya geliyor. `users/{uid}` dokümanını Admin SDK
 * yazıyor — çünkü istemcinin Firestore'a yazma yetkisi yok.
 *
 * Kritik ayrıntı: `role` alanını İSTEMCİDEN ALMIYORUZ. Alsaydık herkes
 * kendini `admin` yapabilirdi. Yeni kullanıcı her zaman `organizer`.
 * Admin yetkisi elle veriliyor.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!idToken) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return Response.json({ error: "Oturum geçersiz." }, { status: 401 });
  }

  let displayNameFromBody: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.displayName === "string") {
      displayNameFromBody = body.displayName.trim();
    }
  } catch {
    // Gövde opsiyonel — Google girişinde isim token'dan geliyor
  }

  const db = getDb();
  const ref = db.doc(paths.user(decoded.uid));
  const snap = await ref.get();

  const displayName =
    displayNameFromBody ||
    decoded.name ||
    decoded.email?.split("@")[0] ||
    "Kullanıcı";

  if (!snap.exists) {
    const doc: UserDoc = {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName,
      role: "organizer", // ← istemciden gelmiyor, bilinçli sabit
      provider: decoded.firebase?.sign_in_provider ?? "password",
      createdAt: new Date().toISOString(),
    };
    await ref.set(doc);
    return Response.json({ user: doc, created: true });
  }

  // Mevcut kullanıcı: sadece isim boşsa dolduruyoruz, role'e dokunmuyoruz
  const existing = snap.data() as UserDoc;
  if (!existing.displayName && displayName) {
    await ref.update({ displayName });
    existing.displayName = displayName;
  }

  return Response.json({ user: existing, created: false });
}
