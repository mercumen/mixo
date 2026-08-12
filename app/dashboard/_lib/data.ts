import "server-only";

import { getDb } from "@/lib/firebase/admin";
import { paths, type EventDoc, type MissionDoc } from "@/lib/schema";

/**
 * Panelin veri katmanı — Firestore'dan SUNUCUDA okuyor.
 *
 * CLAUDE.md kural 3: her sorguda `.limit()` var, istisnasız. Sınırsız sorgu
 * kontrolsüz fatura demek.
 *
 * Yetki: her fonksiyon `ownerUid` ile filtreliyor. Oturumdan gelen uid
 * dışındaki bir etkinliğe erişmek mümkün değil — Security Rules zaten
 * istemciye okuma vermiyor ama sunucu Admin SDK ile okuduğu için filtreyi
 * burada elle koymak zorundayız.
 */

/**
 * Bir organizatörün etkinlikleri, en yenisi başta.
 *
 * NEDEN `orderBy` YOK: `where` + farklı alanda `orderBy` Firestore'da bileşik
 * indeks istiyor. İndeks her ortamda ayrıca yayınlanmak zorunda; unutulduğunda
 * panel "The query requires an index" ile hiç açılmıyor. Bir organizatörün
 * etkinlik sayısı düşük olduğu için sıralamayı bellekte yapmak hem doğru hem
 * de kurulumu bir adım kısaltıyor.
 *
 * SINIRI: `limit` kadar doküman çekilip aralarında sıralanıyor. Bir
 * organizatörün etkinliği bu sınırı aşarsa "en yeni" garantisi bozulur.
 * O gün geldiğinde `firestore.indexes.json`'daki indeks yayınlanıp
 * sorguya `.orderBy("createdAt", "desc")` geri eklenmeli.
 */
export async function listMyEvents(ownerUid: string, limit = 50) {
  const snap = await getDb()
    .collection(paths.events)
    .where("ownerUid", "==", ownerUid)
    .limit(limit)
    .get();

  return snap.docs
    .map((d) => d.data() as EventDoc)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Panelin şu an gösterdiği etkinlik.
 *
 * Henüz etkinlik seçici yok (tasarımda var, davranışı sonraki turda).
 * Şimdilik en son yaratılan etkinlik gösteriliyor; hiç yoksa null dönüyor ve
 * sayfalar boş durum basıyor.
 */
export async function getActiveEvent(
  ownerUid: string,
): Promise<EventDoc | null> {
  // limit(1) kullanmıyoruz: sıralama bellekte yapıldığı için tek doküman
  // çekmek "rastgele bir etkinlik" demek olurdu.
  const events = await listMyEvents(ownerUid);
  return events[0] ?? null;
}

/**
 * Etkinliğin görevleri, panelde gösterildiği sırayla.
 *
 * `order` tek alan sıralaması olduğu için bileşik indeks gerekmiyor —
 * `where` yok, sadece alt koleksiyonun kendisi.
 */
export async function listMissions(eventId: string, limit = 100) {
  const snap = await getDb()
    .collection(paths.missions(eventId))
    .orderBy("order", "asc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as MissionDoc);
}

/** Panelin Görevler sayfasındaki sayaçlar. */
export function missionStats(missions: MissionDoc[]) {
  return {
    total: missions.length,
    active: missions.filter((m) => m.active).length,
    completions: missions.reduce((sum, m) => sum + m.completions, 0),
    pendingAi: missions.filter((m) => m.pendingApproval).length,
  };
}

/** Tek etkinlik, sahiplik kontrolüyle. */
export async function getEventForOwner(
  eventId: string,
  ownerUid: string,
): Promise<EventDoc | null> {
  const snap = await getDb().doc(paths.event(eventId)).get();
  if (!snap.exists) return null;

  const event = snap.data() as EventDoc;
  // Başkasının etkinliğini isteyen "yok" cevabı alıyor — varlığını da
  // sızdırmıyoruz.
  if (event.ownerUid !== ownerUid) return null;

  return event;
}
