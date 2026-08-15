import { after } from "next/server";
import { addToFeed, removeFromFeed } from "@/lib/feed";
import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import { createPhotoReadUrl, deletePhotoObject } from "@/lib/r2";
import {
  paths,
  type MissionDoc,
  type PhotoDoc,
  type SessionDoc,
} from "@/lib/schema";

/**
 * Organizatörün onay kuyruğu.
 *
 * GET  → bekleyen fotoğraflar (kısa ömürlü imzalı adreslerle)
 * POST → { photoId, action: "onayla" | "reddet" }
 *
 * CLAUDE.md kural 8: yeni etkinlikler manuel onay modunda başlıyor, yani
 * normal akışta her fotoğraf buradan geçiyor.
 */

/** CLAUDE.md kural 3: her sorguda limit var. */
const QUEUE_LIMIT = 60;

/** Panelde önizleme adresi — kısa ömürlü, kişisel veri. */
const PREVIEW_TTL_SECONDS = 15 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  const db = getDb();

  /**
   * `status in [...]` + `orderBy` bileşik indeks isterdi. Sıralamayı bellekte
   * yapıyoruz — kuyruk zaten 60 kayıtla sınırlı.
   */
  const snap = await db
    .collection(paths.photos(id))
    .where("status", "in", ["pending", "manual_review"])
    .limit(QUEUE_LIMIT)
    .get();

  const photos = snap.docs
    .map((d) => d.data() as PhotoDoc)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Ad ve görev etiketi için tekil kimlikleri toplu okuyoruz: fotoğraf başına
  // ayrı istek atmak 60 fotoğrafta 120 okuma demekti.
  const [sessions, missions] = await Promise.all([
    readMany<SessionDoc>(
      photos.map((p) => p.sessionId),
      (sid) => paths.session(id, sid),
    ),
    readMany<MissionDoc>(
      photos.map((p) => p.missionId),
      (mid) => `${paths.missions(id)}/${mid}`,
    ),
  ]);

  const items = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      status: photo.status,
      createdAt: photo.createdAt,
      guestName: sessions.get(photo.sessionId)?.displayName ?? "Misafir",
      missionLabel: missions.get(photo.missionId)?.label ?? "",
      /** Strike almış misafirin karesi panelde işaretleniyor */
      flagged: sessions.get(photo.sessionId)?.manualReviewOnly ?? false,
      url: await createPhotoReadUrl(id, photo.id, PREVIEW_TTL_SECONDS),
    })),
  );

  return Response.json({ items, moderationMode: access.event.moderationMode });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { photoId, action } = body;
  if (typeof photoId !== "string") {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (action !== "onayla" && action !== "reddet") {
    return Response.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const db = getDb();
  const photoRef = db.doc(paths.photo(id, photoId));
  const photoSnap = await photoRef.get();
  if (!photoSnap.exists) {
    return Response.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  }
  const photo = photoSnap.data() as PhotoDoc;

  // Henüz inmemiş fotoğraf moderasyona giremez
  if (photo.status === "awaiting_upload") {
    return Response.json({ error: "Fotoğraf henüz yüklenmedi." }, { status: 409 });
  }

  if (action === "reddet") {
    await photoRef.update({ status: "rejected" });

    /**
     * STRIKE (CLAUDE.md): reddedilen misafirin KALAN hakları manuel onaya
     * düşüyor. Etkinlik otomatik modda olsa bile bu misafir otomatik
     * onaydan geçmiyor — bir kez sınırı zorlayan genelde tekrar zorluyor.
     */
    await db
      .doc(paths.session(id, photo.sessionId))
      .update({ manualReviewOnly: true })
      .catch(() => {});

    after(async () => {
      // Onaylanıp sonra reddedilmiş olabilir: ekrandan da düşsün
      await removeFromFeed(id, photoId).catch(() => {});
      // KVKK: reddedilen kare saklanmıyor
      await deletePhotoObject(id, photoId).catch(() => {});
    });

    return Response.json({ ok: true, status: "rejected" });
  }

  // --- onayla ---------------------------------------------------------------
  if (photo.status === "approved") {
    return Response.json({ ok: true, status: "approved" });
  }

  const [sessionSnap, missionSnap] = await Promise.all([
    db.doc(paths.session(id, photo.sessionId)).get(),
    db.doc(`${paths.missions(id)}/${photo.missionId}`).get(),
  ]);
  const session = sessionSnap.data() as SessionDoc | undefined;
  const mission = missionSnap.data() as MissionDoc | undefined;

  await photoRef.update({ status: "approved" });
  await addToFeed({
    eventId: id,
    photo: { ...photo, status: "approved" },
    guestName: session?.displayName ?? "Misafir",
    missionLabel: mission?.label ?? "",
  });

  // Panelde "n kez tamamlandı" sayacı
  if (missionSnap.exists) {
    await missionSnap.ref
      .update({ completions: (mission?.completions ?? 0) + 1 })
      .catch(() => {});
  }

  return Response.json({ ok: true, status: "approved" });
}

/** Tekilleştirip tek `getAll` ile okur. Boş listede Firestore'a gitmiyor. */
async function readMany<T>(
  ids: string[],
  toPath: (id: string) => string,
): Promise<Map<string, T>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const db = getDb();
  const snaps = await db.getAll(...unique.map((id) => db.doc(toPath(id))));

  const map = new Map<string, T>();
  for (const snap of snaps) {
    if (snap.exists) map.set(snap.id, snap.data() as T);
  }
  return map;
}
