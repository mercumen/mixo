import { removeFromFeed } from "@/lib/feed";
import { getDb } from "@/lib/firebase/admin";
import { findEventByCode } from "@/lib/guest-session";
import { deletePhotoObject } from "@/lib/r2";
import { paths, type PhotoDoc } from "@/lib/schema";

/**
 * Misafirin KENDİ fotoğrafını silmesi — akıştaki çöp kutusu ikonu.
 *
 * KVKK: "fotoğrafımı sil" mekanizması ilk günden var (CLAUDE.md). Silme
 * kalıcı: R2 objesi, Firestore dokümanı, feed'deki kare ve beğeni sayacı —
 * hepsi gidiyor. "Soft delete" bilinçli olarak YOK: KVKK silme talebinde
 * veriyi tutmaya devam etmek talebi yerine getirmemek demek.
 *
 * KREDİ GERİ VERİLMİYOR: yükle-sil-yükle döngüsüyle moderasyonu yormanın
 * ve hak sınırını anlamsızlaştırmanın önünü kesiyor.
 */
export async function DELETE(request: Request) {
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
  const snap = await photoRef.get();
  if (!snap.exists) {
    return Response.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  }

  const photo = snap.data() as PhotoDoc;
  // Sadece kendi fotoğrafı — başkasınınki için de 404 (varlık sızdırmıyoruz)
  if (photo.sessionId !== token) {
    return Response.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  }

  await removeFromFeed(event.id, photoId);
  await deletePhotoObject(event.id, photoId).catch(() => {});
  await photoRef.delete();

  return Response.json({ ok: true });
}
