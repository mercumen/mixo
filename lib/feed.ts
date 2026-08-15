import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { createPhotoReadUrl } from "@/lib/r2";
import { paths, type PhotoDoc } from "@/lib/schema";

/**
 * `events/{id}/feed/live` — EKRANIN DİNLEDİĞİ TEK DOKÜMAN.
 *
 * CLAUDE.md kural 2: ekran ASLA koleksiyon dinlemiyor. Koleksiyon dinleyicisi
 * her yeni fotoğrafta okuma harcıyor ve günlük kotayı gecenin ortasında
 * bitiriyor. Bunun yerine tek doküman var, içinde son N onaylı fotoğrafın
 * referansı; ekran sadece ona abone oluyor.
 *
 * FEED ÇEŞİTLİLİĞİ: sıraya eklerken aynı session'ın son karelerde tekrar
 * etmesini engelliyoruz. Kimlik katmanı ne kadar delinirse delinsin (gizli
 * sekmeden ikinci oturum açan misafir) ekranı bir kişinin işgal etmesini
 * bu kural önlüyor — konuşurken de asıl zararın bu olduğunu söylemiştik.
 */

/** Ekranda dönen kare sayısı. CLAUDE.md: son 60 onaylı fotoğraf. */
const FEED_SIZE = 60;

/** Aynı misafir bu kadar kare içinde tekrar görünmüyor. */
const DIVERSITY_WINDOW = 5;

export type FeedItem = {
  photoId: string;
  sessionId: string;
  /** Ekranda fotoğrafın altında görünen ad */
  guestName: string;
  missionLabel: string;
  /** Kısa ömürlü imzalı okuma adresi */
  url: string;
  /** Adresin ne zaman geçersizleşeceği — ekran yenilemeyi buna göre planlıyor */
  urlExpiresAt: string;
  approvedAt: string;
};

export type FeedDoc = {
  items: FeedItem[];
  /**
   * Organizatörün "ekranı dondur" acil butonu.
   *
   * Feed dolmaya DEVAM ediyor, duran şey ekranın dönüşü. Kasten böyle:
   * dondurma anı "ekranda kötü bir kare var" anıdır ve organizatör onu
   * reddedene kadar sürüyor; bu sırada gelen fotoğrafların kaybolmaması
   * gerekiyor. Çözüldüğünde ekran kaldığı yerden devam ediyor.
   */
  frozen: boolean;
  updatedAt: string;
};

/**
 * Ekranın gösterdiği adreslerin ömrü.
 *
 * Uzun tutuyoruz (6 saat): ekran saatlerce açık kalıyor ve adresin gece
 * ortasında geçersizleşmesi fotoğrafların kaybolması demek. Bucket private
 * olduğu için adres yine de süreli — sızsa bile sonsuza kadar geçerli değil.
 */
const FEED_URL_TTL_SECONDS = 6 * 60 * 60;

/**
 * Onaylanan fotoğrafı feed'e ekler.
 *
 * Transaction: iki moderatör aynı anda onaylarsa sıra bozulmasın.
 */
export async function addToFeed(input: {
  eventId: string;
  photo: PhotoDoc;
  guestName: string;
  missionLabel: string;
}): Promise<void> {
  const url = await createPhotoReadUrl(
    input.eventId,
    input.photo.id,
    FEED_URL_TTL_SECONDS,
  );

  const item: FeedItem = {
    photoId: input.photo.id,
    sessionId: input.photo.sessionId,
    guestName: input.guestName,
    missionLabel: input.missionLabel,
    url,
    urlExpiresAt: new Date(
      Date.now() + FEED_URL_TTL_SECONDS * 1000,
    ).toISOString(),
    approvedAt: new Date().toISOString(),
  };

  const ref = getDb().doc(paths.feedLive(input.eventId));

  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current: FeedDoc = snap.exists
      ? (snap.data() as FeedDoc)
      : { items: [], frozen: false, updatedAt: new Date().toISOString() };

    // Aynı fotoğraf iki kez eklenmesin (çift onay)
    if (current.items.some((i) => i.photoId === item.photoId)) return;

    const items = insertWithDiversity(current.items, item);

    tx.set(ref, {
      items: items.slice(0, FEED_SIZE),
      frozen: current.frozen ?? false,
      updatedAt: new Date().toISOString(),
    } satisfies FeedDoc);
  });
}

/**
 * Yeni kareyi başa koyar ama aynı misafir son N karede varsa biraz geriye
 * iter. Böylece bir kişi ekranı arka arkaya işgal edemiyor.
 *
 * Tamamen engellemek yerine geciktiriyoruz: az misafirli bir etkinlikte sert
 * engelleme ekranı boş bırakırdı.
 */
function insertWithDiversity(items: FeedItem[], next: FeedItem): FeedItem[] {
  const recentIndex = items
    .slice(0, DIVERSITY_WINDOW)
    .findIndex((i) => i.sessionId === next.sessionId);

  if (recentIndex === -1) return [next, ...items];

  // Aynı misafirin son karesinden sonraki güvenli konuma yerleştir
  const at = Math.min(DIVERSITY_WINDOW, items.length);
  return [...items.slice(0, at), next, ...items.slice(at)];
}

/** Reddedilen/silinen fotoğrafı feed'den ve beğeni haritasından çıkarır. */
export async function removeFromFeed(eventId: string, photoId: string) {
  const ref = getDb().doc(paths.feedLive(eventId));
  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = snap.data() as FeedDoc;
    tx.set(ref, {
      ...current,
      items: current.items.filter((i) => i.photoId !== photoId),
      updatedAt: new Date().toISOString(),
    } satisfies FeedDoc);
  });

  // Beğeni sayacı da gitsin — silinen karenin sayısı haritada birikmesin
  await getDb()
    .doc(paths.feedLikes(eventId))
    .update({ [`counts.${photoId}`]: FieldValue.delete() })
    .catch(() => {}); // harita henüz yoksa sorun değil
}

// --- beğeniler ---------------------------------------------------------------

/**
 * Beğeni sayaçları TEK dokümanda: `feed/likes` içinde photoId → sayı haritası.
 *
 * Misafir akışı "En Beğenilenler" sırasını buradan alıyor. Fotoğraf başına
 * doküman okumak her akış yenilemesini 60 okumaya çıkarırdı; haritayla
 * akış toplam 2 okuma.
 *
 * `FieldValue.increment` atomik — transaction gerekmiyor, eşzamanlı
 * beğeniler kaybolmuyor.
 */
export type FeedLikesDoc = {
  counts: Record<string, number>;
};

export async function likeDelta(
  eventId: string,
  photoId: string,
  delta: 1 | -1,
) {
  await getDb()
    .doc(paths.feedLikes(eventId))
    .set({ counts: { [photoId]: FieldValue.increment(delta) } }, { merge: true });
}

export async function getLikeCounts(
  eventId: string,
): Promise<Record<string, number>> {
  const snap = await getDb().doc(paths.feedLikes(eventId)).get();
  if (!snap.exists) return {};
  const doc = snap.data() as FeedLikesDoc;
  return doc.counts ?? {};
}

/** Organizatörün "ekranı dondur" acil butonu (CLAUDE.md). */
export async function setFeedFrozen(eventId: string, frozen: boolean) {
  const ref = getDb().doc(paths.feedLive(eventId));
  await ref.set(
    { frozen, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}
