import { getDb } from "@/lib/firebase/admin";
import { eventWindowState, findEventByCode } from "@/lib/guest-session";
import { createPhotoUploadUrl } from "@/lib/r2";
import { paths, type MissionDoc, type PhotoDoc, type SessionDoc } from "@/lib/schema";

/**
 * Yükleme izni — fotoğraf çekildi, R2'ye gönderilecek.
 *
 * KREDİ BURADA DÜŞMÜYOR. Sadece SLOT REZERVE EDİLİYOR (`openIntents++`).
 *
 * Sebep: mekan interneti her etkinlikte sorun çıkarıyor. Krediyi burada
 * düşürsek, PUT patladığında misafirin hakkı boşa gitmiş olurdu. Kredi ancak
 * obje R2'ye GERÇEKTEN indiğinde düşüyor (bkz. upload-complete).
 *
 * Peki sınır neden delinmiyor: rezervasyon sayacı. `remainingCredits -
 * openIntents` sıfırsa yeni izin verilmiyor. Yani misafir arka arkaya 5 izin
 * alıp 5 fotoğraf yükleyemiyor.
 *
 * Süresi dolan rezervasyonlar bir sonraki izin isteğinde temizleniyor —
 * ayrı bir zamanlanmış iş kurmadan.
 */

/** Bu süre içinde obje inmezse rezervasyon serbest bırakılıyor. */
const INTENT_TTL_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { code, token, missionId } = body;

  const event = await findEventByCode(typeof code === "string" ? code : "");
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  // Pencere dışında fotoğraf kabul edilmiyor (CLAUDE.md)
  const windowState = eventWindowState(event);
  if (windowState !== "acik") {
    return Response.json(
      { error: "Etkinlik şu anda fotoğraf kabul etmiyor.", windowState },
      { status: 409 },
    );
  }

  if (typeof token !== "string" || typeof missionId !== "string") {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const db = getDb();
  const sessionRef = db.doc(paths.session(event.id, token));

  // Görev gerçekten bu etkinliğe ait ve aktif mi?
  const missionSnap = await db
    .doc(`${paths.missions(event.id)}/${missionId}`)
    .get();
  if (!missionSnap.exists) {
    return Response.json({ error: "Görev bulunamadı." }, { status: 404 });
  }
  const mission = missionSnap.data() as MissionDoc;
  if (!mission.active || mission.pendingApproval) {
    return Response.json({ error: "Görev aktif değil." }, { status: 409 });
  }

  const photoRef = db.collection(paths.photos(event.id)).doc();
  const now = Date.now();

  try {
    /**
     * Rezervasyon TRANSACTION içinde: iki cihaz (ya da iki sekme) aynı anda
     * izin isterse sayaç bozulmasın. CLAUDE.md kural 4'ün "çift yükleme
     * koruması" dediği yer burası.
     */
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) throw new Error("SESSION_YOK");

      const session = snap.data() as SessionDoc;

      // Süresi dolmuş rezervasyonları geri ver
      const staleSnap = await tx.get(
        db
          .collection(paths.photos(event.id))
          .where("sessionId", "==", token)
          .where("status", "==", "awaiting_upload")
          .limit(10),
      );
      let expired = 0;
      for (const doc of staleSnap.docs) {
        const photo = doc.data() as PhotoDoc;
        if (now - new Date(photo.createdAt).getTime() > INTENT_TTL_MS) {
          tx.delete(doc.ref);
          expired += 1;
        }
      }

      const openIntents = Math.max(0, session.openIntents - expired);
      const available = session.remainingCredits - openIntents;
      if (available <= 0) throw new Error("HAK_BITTI");

      const photo: PhotoDoc = {
        id: photoRef.id,
        sessionId: token,
        missionId,
        r2Key: `events/${event.id}/photos/${photoRef.id}.jpg`,
        status: "awaiting_upload",
        createdAt: new Date(now).toISOString(),
      };

      tx.set(photoRef, photo);
      // Süresi dolanlar düşülmüş hâliyle yazılıyor: sayaç kendini onarıyor
      tx.update(sessionRef, { openIntents: openIntents + 1 });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SESSION_YOK") {
      return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }
    if (message === "HAK_BITTI") {
      return Response.json(
        { error: "Fotoğraf hakkınız kalmadı." },
        { status: 409 },
      );
    }
    console.error("yükleme izni verilemedi:", error);
    return Response.json({ error: "Tekrar deneyin." }, { status: 500 });
  }

  /**
   * İmzalı adres UZUN ÖMÜRLÜ (30 dk): bağlantı koptuğunda istemci AYNI adresi
   * tekrar deniyor. Yeni izin istemiyor — o yüzden tek çekim tek kredi
   * (CLAUDE.md kural 6, yerel retry kuyruğu).
   */
  const { url } = await createPhotoUploadUrl({
    eventId: event.id,
    photoId: photoRef.id,
  });

  return Response.json({ photoId: photoRef.id, uploadUrl: url });
}
