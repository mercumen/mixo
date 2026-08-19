import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/firebase/admin";
import { paths, type EventDoc } from "@/lib/schema";
import {
  isFieldSet,
  LOCKED_FIELDS,
  lockedFieldLabel,
} from "@/lib/event-lock";
import { planHasAiModeration } from "@/lib/plans";
import { setupStepIds, type SetupStepId } from "@/lib/setup-steps";
import {
  findStageTemplate,
  isTemplateAllowed,
  referenceKinds,
  referenceShapes,
} from "@/lib/stage-templates";
import { eventTypes } from "@/app/(onboarding)/_lib/event-setup";

/**
 * Kurulum Sihirbazı adımlarının kaydı.
 *
 * Her adım kendi alanlarını gönderiyor, hepsi opsiyonel — sihirbaz adım adım
 * ilerliyor ve yarıda bırakılabiliyor.
 *
 * SAHİPLİK: etkinliğin `ownerUid`'i oturumdaki kullanıcıyla eşleşmiyorsa
 * "bulunamadı" dönüyoruz. "Yetkin yok" demek etkinliğin varlığını sızdırırdı.
 *
 * İstemcinin ASLA yazamadığı alanlar: `code`, `ownerUid`, `status`,
 * `creditsPerGuest`, `createdAt`. Bunlar gövdeden okunmuyor.
 */

const MAX_NAME_LENGTH = 80;
const MAX_FACTS = 10;
const MAX_FACT_LENGTH = 60;

/** `2026-07-28` + `16:00` → ISO. Etkinlikler Türkiye saatinde. */
function toIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  // +03:00 sabit: Türkiye yaz saati uygulamıyor, tek ofset yeterli.
  const iso = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const db = getDb();
  const ref = db.doc(paths.event(id));
  const snap = await ref.get();

  if (!snap.exists) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }
  const existing = snap.data() as EventDoc;
  if (existing.ownerUid !== user.uid) {
    // Varlığını sızdırmamak için 404
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const patch: Partial<EventDoc> = {};

  // --- Adım 1: Etkinlik Bilgileri ------------------------------------------
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
      return Response.json({ error: "Etkinlik adı geçersiz." }, { status: 400 });
    }
    patch.name = name;
  }

  if (typeof body.typeId === "string") {
    if (!eventTypes.some((t) => t.id === body.typeId)) {
      return Response.json({ error: "Etkinlik türü geçersiz." }, { status: 400 });
    }
    patch.typeId = body.typeId;
  }

  if (typeof body.date === "string") {
    const startTime = typeof body.startTime === "string" ? body.startTime : "";
    const endTime = typeof body.endTime === "string" ? body.endTime : "";

    const startsAt = toIso(body.date, startTime);
    if (!startsAt) {
      return Response.json(
        { error: "Tarih ve başlangıç saati geçersiz." },
        { status: 400 },
      );
    }
    patch.startsAt = startsAt;

    const endsAt = toIso(body.date, endTime);
    // Bitiş başlangıçtan önceyse ertesi güne taşıyoruz: gece yarısını aşan
    // etkinlik normal (düğün 20:00 → 02:00).
    if (endsAt) {
      patch.endsAt =
        endsAt <= startsAt
          ? new Date(new Date(endsAt).getTime() + 86_400_000).toISOString()
          : endsAt;
    }
  }

  if (body.expectedGuests !== undefined) {
    const n = Number(body.expectedGuests);
    if (!Number.isFinite(n) || n < 1 || n > 100_000) {
      return Response.json(
        { error: "Beklenen misafir sayısı geçersiz." },
        { status: 400 },
      );
    }
    patch.expectedGuests = Math.round(n);
  }

  if (typeof body.locationName === "string") {
    patch.locationName = body.locationName.trim().slice(0, 120) || null;
  }

  // --- Adım 2: Sahne Görünümü ----------------------------------------------
  if (typeof body.stageTemplateId === "string") {
    if (!findStageTemplate(body.stageTemplateId)) {
      return Response.json({ error: "Sahne şablonu geçersiz." }, { status: 400 });
    }
    /**
     * Pakete karşı doğrulama SUNUCUDA. Arayüz zaten filtrelenmiş liste
     * gösteriyor ama istemciye güvenmiyoruz: paketinde olmayan bir şablonu
     * doğrudan istekle seçmek mümkün olmamalı.
     *
     * Paket henüz seçilmemişse serbest — sihirbazda Sahne, Paket'ten önce
     * geliyor. Paket seçildiğinde uyum yeniden kontrol ediliyor.
     */
    const planId =
      typeof body.planId === "string" ? body.planId : existing.planId;
    if (!isTemplateAllowed(body.stageTemplateId, planId)) {
      return Response.json(
        { error: "Bu sahne şablonu paketinizde yok." },
        { status: 400 },
      );
    }
    patch.stageTemplateId = body.stageTemplateId;
  }

  if (body.stageMode === "mozaik" || body.stageMode === "akis") {
    patch.stageMode = body.stageMode;
  }

  if (typeof body.stageReferenceKind === "string") {
    if (!referenceKinds.some((k) => k.id === body.stageReferenceKind)) {
      return Response.json({ error: "Referans türü geçersiz." }, { status: 400 });
    }
    patch.stageReferenceKind = body.stageReferenceKind as
      | "sekil"
      | "logo"
      | "foto";
  }

  if (typeof body.stageReferenceShape === "string") {
    if (!referenceShapes.some((sh) => sh.id === body.stageReferenceShape)) {
      return Response.json({ error: "Şekil geçersiz." }, { status: 400 });
    }
    patch.stageReferenceShape = body.stageReferenceShape;
  }

  if (typeof body.stageReferenceKey === "string") {
    patch.stageReferenceKey = body.stageReferenceKey;
  }

  // --- Adım 3: Görev Havuzu -------------------------------------------------
  if (typeof body.missionSubject === "string") {
    patch.missionSubject = body.missionSubject.trim().slice(0, 80) || null;
  }
  if (typeof body.missionTone === "string") {
    patch.missionTone = body.missionTone.trim().slice(0, 40) || null;
  }
  if (typeof body.missionTheme === "string") {
    patch.missionTheme = body.missionTheme.trim().slice(0, 80) || null;
  }
  if (Array.isArray(body.missionFacts)) {
    patch.missionFacts = body.missionFacts
      .filter((f): f is string => typeof f === "string")
      .map((f) => f.trim().slice(0, MAX_FACT_LENGTH))
      .filter((f) => f.length > 0)
      .slice(0, MAX_FACTS);
  }

  // --- Adım 4: Paket --------------------------------------------------------
  if (typeof body.planId === "string") {
    patch.planId = body.planId;
  }

  /**
   * Moderasyon modu.
   *
   * PAKET KAPISI: "otomatik" ancak yapay zeka denetimi olan pakette
   * seçilebiliyor. Essential'da otomatiğe geçmek "kör onay" demek olurdu —
   * fotoğraf hiçbir kontrolden geçmeden ekrana düşerdi.
   *
   * Bu alan bir süre HİÇBİR YERDEN değiştirilemiyordu (ne panelde düğme, ne
   * burada alan). Sonuç: yeni etkinlikler manuel başladığı için organizatör
   * manuel modda kilitli kalıyordu ve her kare onay kuyruğuna düşüyordu.
   */
  if (body.moderationMode === "manuel" || body.moderationMode === "otomatik") {
    const planId =
      typeof body.planId === "string" ? body.planId : existing.planId;

    if (body.moderationMode === "otomatik" && !planHasAiModeration(planId)) {
      return Response.json(
        {
          error:
            "Otomatik moderasyon Professional ve üstü paketlerde. Fotoğrafları elle onaylamaya devam edebilirsiniz.",
        },
        { status: 403 },
      );
    }
    patch.moderationMode = body.moderationMode;
  }

  // --- Adım tamamlama -------------------------------------------------------
  if (typeof body.completedStep === "string") {
    const step = body.completedStep as SetupStepId;
    if (!setupStepIds.includes(step)) {
      return Response.json({ error: "Bilinmeyen adım." }, { status: 400 });
    }
    // Aynı adım iki kez işaretlenmesin
    patch.completedSteps = Array.from(
      new Set([...(existing.completedSteps ?? []), step]),
    );
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  try {
    /**
     * SABİT ALAN KONTROLÜ — arayüzde gizlemek yetmez.
     *
     * Tarih, tür, katılımcı sayısı ve paket bir kere girilip sabitleniyor
     * (bkz. lib/event-lock.ts). Dolu bir alanı değiştiren istek 403 alıyor;
     * boş alanı ilk kez doldurmak serbest, sihirbaz böyle çalışıyor.
     */
    for (const field of LOCKED_FIELDS) {
      if (!(field in patch)) continue;
      if (!isFieldSet(existing, field)) continue;
      if (patch[field] === existing[field]) continue;
      return Response.json(
        {
          error: `${lockedFieldLabel(field)} sonradan değiştirilemiyor. Değişiklik gerekiyorsa bizimle iletişime geçin.`,
        },
        { status: 403 },
      );
    }

    await ref.update(patch);
    const updated = { ...existing, ...patch };
    return Response.json({ event: updated });
  } catch (error) {
    console.error("etkinlik güncellenemedi:", error);
    return Response.json(
      { error: "Kaydedilemedi, tekrar deneyin." },
      { status: 500 },
    );
  }
}
