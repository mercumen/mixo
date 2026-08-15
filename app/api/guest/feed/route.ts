import { getDb } from "@/lib/firebase/admin";
import { getLikeCounts, type FeedDoc } from "@/lib/feed";
import { findEventByCode } from "@/lib/guest-session";
import { paths } from "@/lib/schema";

/**
 * Misafirin Canlı Akış'ı.
 *
 * Ekranla AYNI dokümanı okuyoruz (`feed/live`) — koleksiyon sorgusu yok.
 * Beğenilerle birlikte istek başına 2 Firestore okuması; 500 misafir
 * 30 saniyede bir yenilese bile gece boyunca kota derdine girmiyoruz.
 *
 * `sessionId` İSTEMCİYE SIZMIYOR: kimin hangi oturumla yüklediği başka
 * misafirin bileceği şey değil. Bunun yerine `mine` bayrağı dönüyor.
 *
 * Sıralama: tasarımdaki "En Beğenilenler" — beğeni çoktan aza, eşitlikte
 * yeni olan önde.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const event = await findEventByCode(code);
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const [feedSnap, likes] = await Promise.all([
    getDb().doc(paths.feedLive(event.id)).get(),
    getLikeCounts(event.id),
  ]);

  const feed = feedSnap.exists ? (feedSnap.data() as FeedDoc) : null;

  const items = (feed?.items ?? [])
    .map((item) => ({
      photoId: item.photoId,
      guestName: item.guestName,
      missionLabel: item.missionLabel,
      url: item.url,
      approvedAt: item.approvedAt,
      likes: Math.max(0, likes[item.photoId] ?? 0),
      mine: Boolean(token) && item.sessionId === token,
    }))
    .sort(
      (a, b) =>
        b.likes - a.likes || b.approvedAt.localeCompare(a.approvedAt),
    );

  return Response.json({ items });
}
