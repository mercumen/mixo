import { getDb } from "@/lib/firebase/admin";
import { paths, type EventDoc, type PhotoDoc } from "@/lib/schema";

/**
 * TAKILAN FOTOĞRAF SÜPÜRGESİ — CLAUDE.md'nin 60 saniye kuralı.
 *
 * "60 saniyeden uzun `pending` kalan fotoğraf otomatik insan kuyruğuna düşer
 * (boru takılırsa fotoğraf sessizce kaybolmasın)."
 *
 * Neden gerekli: moderasyon `after()` içinde çalışıyor. Fonksiyon zaman aşımına
 * düşer, model yanıt vermez ya da deploy tam o anda olursa fotoğraf `pending`
 * durumunda asılı kalır — organizatörün onay kuyruğu `pending`i gösterdiği için
 * aslında görünür, ama `manual_review`'a çekmek onu "beklemede" değil
 * "bakılması gerekiyor" hâline getiriyor ve kaybolmadığını garantiliyor.
 *
 * YETKİ: Vercel Cron çağrıları `CRON_SECRET` varsa `Authorization: Bearer`
 * başlığıyla geliyor. Sır tanımlıysa doğruluyoruz; tanımlı değilse uç yine
 * çalışıyor ama sadece okuma + durum güncellemesi yaptığı için kötüye
 * kullanımı anlamsız (kimseye veri sızdırmıyor).
 */

/** Bu süreden uzun `pending` kalan kare insan kuyruğuna düşüyor. */
const STUCK_AFTER_MS = 60_000;

/** CLAUDE.md kural 3: limitsiz sorgu yok. */
const EVENT_LIMIT = 20;
const PHOTO_LIMIT = 50;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Yetkisiz." }, { status: 401 });
    }
  }

  const db = getDb();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();

  /**
   * Sadece CANLI etkinliklere bakıyoruz. Bitmiş etkinliklerin takılı karesini
   * kuyruğa düşürmenin faydası yok, tarama maliyeti var.
   */
  const events = await db
    .collection(paths.events)
    .where("status", "==", "canli")
    .limit(EVENT_LIMIT)
    .get();

  let swept = 0;
  const touched: string[] = [];

  for (const eventDoc of events.docs) {
    const event = eventDoc.data() as EventDoc;

    const photos = await db
      .collection(paths.photos(event.id))
      .where("status", "==", "pending")
      .limit(PHOTO_LIMIT)
      .get();

    const stuck = photos.docs.filter(
      (d) => (d.data() as PhotoDoc).createdAt < cutoff,
    );
    if (stuck.length === 0) continue;

    const batch = db.batch();
    for (const d of stuck) {
      batch.update(d.ref, { status: "manual_review" });
    }
    await batch.commit();

    swept += stuck.length;
    touched.push(`${event.code}:${stuck.length}`);
  }

  return Response.json({ swept, touched });
}
