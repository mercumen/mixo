import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/firebase/admin";
import { paths, type EventDoc } from "@/lib/schema";

/**
 * "Bu etkinlik gerçekten bu organizatörün mü?"
 *
 * Yetkisiz erişimde 404 dönüyoruz, 403 değil: 403 etkinliğin VAR olduğunu
 * söyler. Etkinlik kodları kısa ve tahmin edilebilir olduğu için bu sızıntı
 * gerçek — deneme yanılmayla hangi kodların kullanıldığı öğrenilebilirdi.
 */
export type EventAccess =
  | { ok: true; event: EventDoc; uid: string }
  | { ok: false; response: Response };

export async function requireOwnedEvent(
  eventId: string,
): Promise<EventAccess> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Oturum bulunamadı." }, { status: 401 }),
    };
  }

  const snap = await getDb().doc(paths.event(eventId)).get();
  const notFound = Response.json(
    { error: "Etkinlik bulunamadı." },
    { status: 404 },
  );

  if (!snap.exists) return { ok: false, response: notFound };

  const event = snap.data() as EventDoc;
  if (event.ownerUid !== user.uid) return { ok: false, response: notFound };

  return { ok: true, event, uid: user.uid };
}
