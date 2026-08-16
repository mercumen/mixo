import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import { paths, type MissionDoc } from "@/lib/schema";

/**
 * Görev havuzu — manuel görev ekleme.
 *
 * Etkinlik yaratılırken şablon havuzundan görevler KOPYALANIYOR
 * (bkz. /api/events). Burası organizatörün sonradan kendi görevini
 * eklediği yer; Essential pakette havuzu elle doldurmanın tek yolu bu.
 *
 * Şablon kopyaları doküman kimliği olarak şablon id'sini kullanıyor;
 * manuel görevler rastgele kimlik alıyor ki aynı metin iki kez eklenebilsin
 * (organizatör bilerek tekrar edebilir, biz karar vermiyoruz).
 */

const MAX_LABEL = 120;
const MIN_LABEL = 3;

/** Havuz sınırı: misafire dağıtım ve panel sorguları sınırsız büyümesin. */
const MAX_MISSIONS = 60;

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

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (label.length < MIN_LABEL || label.length > MAX_LABEL) {
    return Response.json(
      { error: `Görev metni ${MIN_LABEL}-${MAX_LABEL} karakter olmalı.` },
      { status: 400 },
    );
  }

  const db = getDb();
  const col = db.collection(paths.missions(id));

  // Sıra numarası için mevcut görevlere bakıyoruz (limit'li — CLAUDE.md kural 3)
  const snap = await col.orderBy("order", "desc").limit(1).get();
  const countSnap = await col.count().get();

  if (countSnap.data().count >= MAX_MISSIONS) {
    return Response.json(
      { error: `En fazla ${MAX_MISSIONS} görev eklenebilir.` },
      { status: 409 },
    );
  }

  const lastOrder = snap.empty ? -1 : (snap.docs[0].data() as MissionDoc).order;

  const ref = col.doc();
  const mission: MissionDoc = {
    id: ref.id,
    label,
    source: "manuel",
    active: true,
    completions: 0,
    order: lastOrder + 1,
    // Organizatörün kendi yazdığı görev onay beklemiyor
    pendingApproval: false,
    createdAt: new Date().toISOString(),
  };

  await ref.set(mission);
  return Response.json({ mission }, { status: 201 });
}
