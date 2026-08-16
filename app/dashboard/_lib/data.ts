import "server-only";

import { getLikeCounts } from "@/lib/feed";
import { getDb } from "@/lib/firebase/admin";
import { createPhotoReadUrl } from "@/lib/r2";
import {
  paths,
  type EventDoc,
  type MissionDoc,
  type PhotoDoc,
  type PhotoStatus,
  type SessionDoc,
} from "@/lib/schema";

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

// --- fotoğraflar (Canlı Akış + Galeri) --------------------------------------

/**
 * Panelin fotoğraf görünümü.
 *
 * Ham `PhotoDoc` değil ekrana hazır satır: misafir adı, görev metni ve
 * imzalı görsel adresi çözülmüş halde geliyor. Sayfalar server component
 * olduğu için bu iş sunucuda bitiyor, istemciye sadece sonuç gidiyor.
 */
export type DashboardPhoto = {
  id: string;
  status: PhotoStatus;
  guest: string;
  task: string;
  likes: number;
  /** Kısa ömürlü imzalı R2 adresi */
  url: string;
  createdAt: string;
};

/** Panelde önizleme adresinin ömrü. Kişisel veri — uzun tutmuyoruz. */
const PREVIEW_TTL_SECONDS = 30 * 60;

/** CLAUDE.md kural 3: limitsiz sorgu yok. */
const PHOTO_LIMIT = 120;

/**
 * Etkinliğin fotoğrafları — `awaiting_upload` hariç.
 *
 * `awaiting_upload` elenir çünkü o kayıtlar sadece rezervasyon; objeleri
 * R2'ye inmemiş olabilir ve panelde kırık kare gösterirdi.
 *
 * İsim ve görev etiketi için tekil kimlikler TOPLU okunuyor: fotoğraf
 * başına ayrı istek 120 fotoğrafta 240 okuma demekti.
 */
export async function listEventPhotos(
  eventId: string,
  limit = PHOTO_LIMIT,
): Promise<DashboardPhoto[]> {
  const db = getDb();

  const snap = await db
    .collection(paths.photos(eventId))
    .where("status", "in", ["pending", "manual_review", "approved", "rejected"])
    .limit(limit)
    .get();

  if (snap.empty) return [];

  // Sıralama bellekte: `status in` + `orderBy` bileşik indeks isterdi
  const photos = snap.docs
    .map((d) => d.data() as PhotoDoc)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const sessionIds = [...new Set(photos.map((p) => p.sessionId).filter(Boolean))];
  const missionIds = [...new Set(photos.map((p) => p.missionId).filter(Boolean))];

  const [sessionSnaps, missionSnaps, likes] = await Promise.all([
    sessionIds.length
      ? db.getAll(...sessionIds.map((id) => db.doc(paths.session(eventId, id))))
      : Promise.resolve([]),
    missionIds.length
      ? db.getAll(
          ...missionIds.map((id) => db.doc(`${paths.missions(eventId)}/${id}`)),
        )
      : Promise.resolve([]),
    getLikeCounts(eventId),
  ]);

  const names = new Map<string, string>();
  for (const s of sessionSnaps) {
    if (s.exists) names.set(s.id, (s.data() as SessionDoc).displayName);
  }

  const labels = new Map<string, string>();
  for (const m of missionSnaps) {
    if (m.exists) labels.set(m.id, (m.data() as MissionDoc).label);
  }

  // İmzalama yerel bir işlem (ağ isteği yok), hepsini birden üretmek ucuz
  return Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      status: p.status,
      guest: names.get(p.sessionId) ?? "Misafir",
      task: labels.get(p.missionId) ?? "",
      likes: likes[p.id] ?? 0,
      url: await createPhotoReadUrl(eventId, p.id, PREVIEW_TTL_SECONDS),
      createdAt: p.createdAt,
    })),
  );
}

/** Canlı Akış üstündeki dört sayaç. */
export function photoStats(photos: DashboardPhoto[]) {
  return {
    total: photos.length,
    pending: photos.filter(
      (p) => p.status === "pending" || p.status === "manual_review",
    ).length,
    approved: photos.filter((p) => p.status === "approved").length,
    rejected: photos.filter((p) => p.status === "rejected").length,
  };
}
