import { likeDelta } from "@/lib/feed";
import { findEventByCode, getSession } from "@/lib/guest-session";

/**
 * Beğeni — { code, token, photoId, liked }.
 *
 * Oturumu olmayan beğenemiyor: sayacı curl ile şişirmenin önündeki tek
 * engel bu (arayüz de oturumsuz kalbe basılınca isim ekranına yönlendiriyor).
 *
 * "Aynı kişi iki kez beğenemesin" takibi İSTEMCİDE (localStorage) —
 * beğeni başına Firestore'a kayıt atmak maliyete değmiyor; bu bir düğün
 * eğlencesi, oylama sistemi değil. Kalp geri çekilince `liked: false`
 * geliyor ve sayaç bir azalıyor.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { code, token, photoId, liked } = body;

  const event = await findEventByCode(typeof code === "string" ? code : "");
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }
  if (
    typeof token !== "string" ||
    typeof photoId !== "string" ||
    typeof liked !== "boolean"
  ) {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const session = await getSession(event.id, token);
  if (!session) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  await likeDelta(event.id, photoId, liked ? 1 : -1);
  return Response.json({ ok: true });
}
