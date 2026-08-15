import { after } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { addToFeed } from "@/lib/feed";
import { findEventByCode } from "@/lib/guest-session";
import { applyCacheControl, getPhotoObjectInfo, photoKey } from "@/lib/r2";
import {
  paths,
  type EventDoc,
  type MissionDoc,
  type PhotoDoc,
  type SessionDoc,
} from "@/lib/schema";

/**
 * Yükleme tamamlandı.
 *
 * KREDİ TAM BURADA DÜŞÜYOR — ve istemcinin sözüne değil, R2'ye sorarak.
 *
 * İstemci "yükledim" diyor; biz R2'ye HEAD atıp objenin gerçekten indiğini
 * görüyoruz. Obje yoksa hiçbir şey olmuyor, hak yanmıyor. Konuşurken
 * istediğin davranış buydu: "inmeyen fotoğraf hak yakmayacak."
 *
 * Sonrasında moderasyon `after()` içinde çalışıyor — misafir beklemiyor.
 */

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { code, token, photoId } = body;

  const event = await findEventByCode(typeof code === "string" ? code : "");
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }
  if (typeof token !== "string" || typeof photoId !== "string") {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const db = getDb();
  const photoRef = db.doc(paths.photo(event.id, photoId));
  const photoSnap = await photoRef.get();
  if (!photoSnap.exists) {
    return Response.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  }

  const photo = photoSnap.data() as PhotoDoc;
  // Başkasının fotoğrafını tamamlamak mümkün olmamalı
  if (photo.sessionId !== token) {
    return Response.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  }

  // Zaten tamamlanmışsa tekrar kredi düşmüyoruz (çift çağrı koruması)
  if (photo.status !== "awaiting_upload") {
    return Response.json({ ok: true, status: photo.status });
  }

  /**
   * OBJE GERÇEKTEN İNDİ Mİ? Kredi düşümünün tek dayanağı bu.
   * Boyut da bedava geliyor — byte indirmeden.
   */
  const info = await getPhotoObjectInfo(event.id, photoId);
  if (!info) {
    return Response.json(
      { error: "Fotoğraf yüklenmemiş görünüyor." },
      { status: 409 },
    );
  }
  if (info.bytes > MAX_BYTES) {
    // İstemci sıkıştırması ~350 KB hedefliyor; bu sınır kaçakları yakalıyor
    await photoRef.update({ status: "rejected", bytes: info.bytes });
    return Response.json({ error: "Fotoğraf çok büyük." }, { status: 413 });
  }

  const sessionRef = db.doc(paths.session(event.id, token));

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) throw new Error("SESSION_YOK");
      const session = snap.data() as SessionDoc;

      const fresh = await tx.get(photoRef);
      const current = fresh.data() as PhotoDoc;
      // Transaction içinde tekrar bak: iki istek yarışmış olabilir
      if (current.status !== "awaiting_upload") return;

      tx.update(sessionRef, {
        remainingCredits: Math.max(0, session.remainingCredits - 1),
        openIntents: Math.max(0, session.openIntents - 1),
      });

      tx.update(photoRef, {
        status: "pending",
        bytes: info.bytes,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SESSION_YOK") {
      return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }
    console.error("yükleme tamamlanamadı:", error);
    return Response.json({ error: "Tekrar deneyin." }, { status: 500 });
  }

  /**
   * Buradan sonrası misafiri bekletmiyor.
   *
   * Cache-Control: tarayıcı bu header'ı göndermiyor (CORS bağımlılığı
   * yaratıyordu), sunucu yazıyor — CLAUDE.md kural 7.
   *
   * Moderasyon: etkinlik manuel moddaysa fotoğraf insan kuyruğunda bekliyor
   * (CLAUDE.md kural 8, yeni etkinlikler manuel başlıyor). Otomatik mod
   * OpenAI'a bağlandığında burası genişleyecek.
   */
  after(async () => {
    try {
      await applyCacheControl(photoKey(event.id, photoId), "image/jpeg");
    } catch (error) {
      console.error("cache-control yazılamadı:", photoId, error);
    }

    try {
      await autoApproveIfAllowed(event, photoId, token);
    } catch (error) {
      console.error("moderasyon adımı başarısız:", photoId, error);
    }
  });

  return Response.json({ ok: true, status: "pending" });
}

/**
 * Otomatik mod açıksa ve misafir strike yemediyse doğrudan feed'e alır.
 *
 * Manuel modda hiçbir şey yapmıyor — fotoğraf `pending` kalıyor ve
 * organizatörün onay kuyruğuna düşüyor.
 */
async function autoApproveIfAllowed(
  event: EventDoc,
  photoId: string,
  sessionId: string,
) {
  if (event.moderationMode !== "otomatik") return;

  const db = getDb();
  const sessionSnap = await db.doc(paths.session(event.id, sessionId)).get();
  const session = sessionSnap.data() as SessionDoc | undefined;

  // Strike: bir fotoğrafı reddedilen misafirin kalanları manuel onaya düşüyor
  if (!session || session.manualReviewOnly) return;

  const photoSnap = await db.doc(paths.photo(event.id, photoId)).get();
  const photo = photoSnap.data() as PhotoDoc | undefined;
  if (!photo || photo.status !== "pending") return;

  const missionSnap = await db
    .doc(`${paths.missions(event.id)}/${photo.missionId}`)
    .get();
  const mission = missionSnap.data() as MissionDoc | undefined;

  await db.doc(paths.photo(event.id, photoId)).update({ status: "approved" });
  await addToFeed({
    eventId: event.id,
    photo: { ...photo, status: "approved" },
    guestName: session.displayName,
    missionLabel: mission?.label ?? "",
  });
}
