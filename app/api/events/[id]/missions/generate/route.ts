import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import {
  generateMissions,
  MissionAiError,
  MISSIONS_PER_RUN,
} from "@/lib/mission-ai";
import { planHasAiMissions } from "@/lib/plans";
import { paths, type MissionDoc } from "@/lib/schema";

/**
 * AI ile görev üretimi.
 *
 * Üretilenler DOĞRUDAN havuza girmiyor: `pendingApproval: true` ile onay
 * kuyruğuna düşüyorlar. Organizatör onaylayınca canlıya çıkıyorlar
 * (`active: true` doğuyorlar, onay sadece bekleme bayrağını kaldırıyor).
 *
 * Model bir insanın yazdığı kadar isabetli değil; misafire giden metni
 * onaysız bırakmak, ekranda 200 kişinin önünde tuhaf bir görev görmek
 * demek olurdu.
 */

/** Havuz tavanı — misafire dağıtım ve panel sorguları şişmesin. */
const MAX_MISSIONS = 60;

/**
 * Onay kuyruğu tıkalıysa yeni üretim yok.
 *
 * Hem para hem kalite koruması: organizatör bakmadan üst üste "üret"
 * derse hem faturayı büyütür hem de değerlendiremeyeceği bir yığın
 * biriktirir.
 */
const MAX_PENDING = 5;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  const event = access.event;

  // Paket kapısı: Essential havuzu elle dolduruyor
  if (!planHasAiMissions(event.planId)) {
    return Response.json(
      {
        error:
          "AI görev üretimi Professional ve üstü paketlerde. Havuza elle görev ekleyebilirsiniz.",
      },
      { status: 403 },
    );
  }

  // Girdi yoksa üretmiyoruz: boş bağlam jenerik, işe yaramaz görev üretir
  const hasContext = Boolean(
    event.missionSubject || event.missionTheme || event.missionFacts?.length,
  );
  if (!hasContext) {
    return Response.json(
      {
        error:
          "Önce Görev Havuzu adımını doldurun — kim için, hangi ton, hangi tema.",
      },
      { status: 400 },
    );
  }

  const db = getDb();
  const col = db.collection(paths.missions(id));

  // Mevcut havuz: hem tavan kontrolü hem de tekrarı önlemek için lazım
  const snap = await col.orderBy("order", "desc").limit(MAX_MISSIONS).get();
  const existing = snap.docs.map((d) => d.data() as MissionDoc);

  const pendingCount = existing.filter((m) => m.pendingApproval).length;
  if (pendingCount >= MAX_PENDING) {
    return Response.json(
      {
        error: `Onay bekleyen ${pendingCount} görev var. Önce onları değerlendirin.`,
      },
      { status: 409 },
    );
  }

  const room = MAX_MISSIONS - existing.length;
  if (room <= 0) {
    return Response.json(
      { error: `Havuz dolu (en fazla ${MAX_MISSIONS} görev).` },
      { status: 409 },
    );
  }

  let labels: string[];
  try {
    labels = await generateMissions({
      typeId: event.typeId,
      subject: event.missionSubject,
      toneId: event.missionTone,
      theme: event.missionTheme,
      facts: event.missionFacts ?? [],
      existingLabels: existing.map((m) => m.label),
    });
  } catch (error) {
    if (error instanceof MissionAiError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    console.error("görev üretimi başarısız:", error);
    return Response.json({ error: "Görevler üretilemedi." }, { status: 500 });
  }

  const lastOrder = existing.length > 0 ? existing[0].order : -1;
  const now = new Date().toISOString();

  const batch = db.batch();
  const created = labels.slice(0, Math.min(room, MISSIONS_PER_RUN));

  created.forEach((label, i) => {
    const ref = col.doc();
    const mission: MissionDoc = {
      id: ref.id,
      label,
      source: "ai",
      // Onaylanınca tek tıkla canlıya çıksın diye açık doğuyor;
      // `pendingApproval` misafire gitmesini zaten engelliyor.
      active: true,
      completions: 0,
      order: lastOrder + 1 + i,
      pendingApproval: true,
      createdAt: now,
    };
    batch.set(ref, mission);
  });

  await batch.commit();

  return Response.json({ count: created.length, missions: created });
}
