import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/firebase/admin";
import {
  applyCacheControl,
  createUploadUrl,
  headObject,
  stageReferenceKey,
} from "@/lib/r2";
import { paths, type EventDoc } from "@/lib/schema";

/**
 * Mozaik referansı (logo / referans fotoğraf) yükleme izni.
 *
 * CLAUDE.md kural 1: dosya SUNUCUDAN GEÇMİYOR. Sunucu sadece imzalı bir PUT
 * adresi üretiyor, tarayıcı doğrudan R2'ye yüklüyor.
 *
 * İki aşamalı:
 *   POST → izin adresi al (bu dosya)
 *   PUT  → tarayıcı R2'ye yükler
 *   PATCH /api/events/{id} → anahtarı etkinliğe yaz (obje doğrulanarak)
 *
 * Boyut/tür kontrolü: `contentType` burada, gerçek boyut ise obje indikten
 * sonra HEAD ile doğrulanıyor (aşağıdaki PUT metodunda). İstemcinin
 * söylediğine güvenmiyoruz.
 */

/** Tasarım şeffaf zeminli PNG öneriyor; JPEG ve WebP de kabul. */
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Logo/referans görseli için üst sınır. Mozaik kaynağı, dev dosya gerekmiyor. */
const MAX_BYTES = 8 * 1024 * 1024;

async function loadOwnedEvent(eventId: unknown, uid: string) {
  if (typeof eventId !== "string" || eventId.length === 0) return null;
  const snap = await getDb().doc(paths.event(eventId)).get();
  if (!snap.exists) return null;
  const event = snap.data() as EventDoc;
  // Başkasının etkinliğine yükleme yapılamaz
  return event.ownerUid === uid ? event : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { eventId, kind, contentType } = body;

  const event = await loadOwnedEvent(eventId, user.uid);
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  if (kind !== "logo" && kind !== "foto") {
    return Response.json({ error: "Referans türü geçersiz." }, { status: 400 });
  }

  if (typeof contentType !== "string" || !ALLOWED[contentType]) {
    return Response.json(
      { error: "Sadece PNG, JPEG veya WebP yükleyebilirsiniz." },
      { status: 400 },
    );
  }

  try {
    const key = stageReferenceKey(event.id, kind, ALLOWED[contentType]);
    const url = await createUploadUrl({ key, contentType });
    return Response.json({ url, key });
  } catch (error) {
    console.error("yükleme izni üretilemedi:", error);
    return Response.json(
      { error: "Yükleme başlatılamadı, tekrar deneyin." },
      { status: 500 },
    );
  }
}

/**
 * Yükleme tamamlandı — objeyi DOĞRULA ve etkinliğe yaz.
 *
 * İstemcinin "yükledim" demesine güvenmiyoruz: R2'ye HEAD atıp objenin
 * gerçekten indiğini ve boyutunu kontrol ediyoruz. Byte indirmeden geliyor.
 */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { eventId, kind, key } = body;

  const event = await loadOwnedEvent(eventId, user.uid);
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  if (kind !== "logo" && kind !== "foto") {
    return Response.json({ error: "Referans türü geçersiz." }, { status: 400 });
  }

  // Anahtar bu etkinliğin klasöründe olmak zorunda — başka etkinliğin
  // objesini kendi etkinliğine bağlamak mümkün olmamalı
  if (
    typeof key !== "string" ||
    !key.startsWith(`events/${event.id}/reference/`)
  ) {
    return Response.json({ error: "Dosya yolu geçersiz." }, { status: 400 });
  }

  const info = await headObject(key);
  if (!info) {
    return Response.json(
      { error: "Dosya yüklenmemiş görünüyor, tekrar deneyin." },
      { status: 409 },
    );
  }
  if (info.bytes > MAX_BYTES) {
    return Response.json(
      { error: "Dosya 8 MB sınırını aşıyor." },
      { status: 413 },
    );
  }

  /**
   * Cache-Control'ü BURADA yazıyoruz (CLAUDE.md kural 7).
   *
   * Tarayıcı bu header'ı göndermiyor — göndermesi CORS `AllowedHeaders`
   * listesine bağımlılık yaratıyordu ve o liste elle yönetiliyor. Objeyi
   * kendi üstüne kopyalayıp metadata'yı değiştiriyoruz; byte'lar R2 içinde
   * kalıyor.
   *
   * Başarısız olursa akışı kırmıyoruz: dosya kullanılabilir durumda,
   * yalnızca önbelleklenmiyor.
   */
  try {
    await applyCacheControl(key, info.contentType);
  } catch (error) {
    console.error("cache-control yazılamadı:", key, error);
  }

  try {
    await getDb()
      .doc(paths.event(event.id))
      .update({
        stageReferenceKey: key,
        stageReferenceKind: kind,
      });
    return Response.json({ ok: true, key, bytes: info.bytes });
  } catch (error) {
    console.error("referans kaydedilemedi:", error);
    return Response.json({ error: "Kaydedilemedi." }, { status: 500 });
  }
}
