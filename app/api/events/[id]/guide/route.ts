import { FieldValue } from "firebase-admin/firestore";
import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import { GUIDE_DISMISSED, MANUAL_STEPS } from "@/lib/guide";
import { paths } from "@/lib/schema";

/**
 * Rehber adımı işaretleme.
 *
 * Yalnızca ELLE kaydedilen adımları kabul ediyor (qr, moderasyon, ekran,
 * kart kapatma). Veriden türeyen adımları ("görev havuzu hazır" gibi)
 * istemcinin yazmasına izin yok — tek doğruları verinin kendisi, yoksa
 * "işaretli ama aslında bitmemiş" tutarsızlığı doğar.
 *
 * Geri alma yok: rehber bir kontrol listesi, denetim kaydı değil.
 * `arrayUnion` çift tıklamada da diziyi şişirmiyor.
 */
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

  const step = body.step;
  const allowed = [...MANUAL_STEPS, GUIDE_DISMISSED] as string[];
  if (typeof step !== "string" || !allowed.includes(step)) {
    return Response.json({ error: "Geçersiz adım." }, { status: 400 });
  }

  await getDb()
    .doc(paths.event(id))
    .update({ guideDone: FieldValue.arrayUnion(step) });

  return Response.json({ ok: true });
}
