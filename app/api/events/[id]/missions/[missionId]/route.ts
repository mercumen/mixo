import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import { paths, type MissionDoc } from "@/lib/schema";

/**
 * Tek görev — düzenleme ve silme.
 *
 * PATCH  { active }          → misafire dağıtımı aç/kapat
 *        { pendingApproval } → AI görevini onayla (false yap)
 *        { label }           → metni düzelt
 * DELETE                     → havuzdan çıkar
 *
 * Silme yerine "kapat" tercih edilmeli: kapalı görev misafire gitmiyor ama
 * geçmiş fotoğrafların `missionId` bağı kırılmıyor. Silmeyi yine de
 * veriyoruz — yanlış yazılmış görevi taşımanın anlamı yok.
 */

const MAX_LABEL = 120;
const MIN_LABEL = 3;

async function missionRef(eventId: string, missionId: string) {
  return getDb().doc(`${paths.missions(eventId)}/${missionId}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; missionId: string }> },
) {
  const { id, missionId } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ref = await missionRef(id, missionId);
  const snap = await ref.get();
  if (!snap.exists) {
    return Response.json({ error: "Görev bulunamadı." }, { status: 404 });
  }

  const patch: Partial<MissionDoc> = {};

  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.pendingApproval === false) patch.pendingApproval = false;

  if (typeof body.label === "string") {
    const label = body.label.trim();
    if (label.length < MIN_LABEL || label.length > MAX_LABEL) {
      return Response.json({ error: "Görev metni geçersiz." }, { status: 400 });
    }
    patch.label = label;
  }

  // `completions` ve `source` istemciden GELMİYOR: sayaç sunucunun,
  // kaynak da görevin doğduğu yerin bilgisi.
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Değişiklik yok." }, { status: 400 });
  }

  await ref.update(patch);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; missionId: string }> },
) {
  const { id, missionId } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  const ref = await missionRef(id, missionId);
  await ref.delete();
  return Response.json({ ok: true });
}
