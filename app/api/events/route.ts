import { getCurrentUser } from "@/lib/auth/session";
import { generateUniqueEventCode } from "@/lib/event-code";
import { getDb } from "@/lib/firebase/admin";
import { templatesForType } from "@/lib/mission-templates";
import { isPlanId } from "@/lib/plans";
import { paths, type EventDoc, type MissionDoc } from "@/lib/schema";
import { eventTypes, guestRanges } from "@/app/(onboarding)/_lib/event-setup";

/**
 * Etkinlik oluşturma.
 *
 * TEK YARATMA YOLU: panelin Kurulum Sihirbazı'nın 1. adımı.
 *
 * Landing'deki cümle akışı etkinlik YARATMIYOR — cevapları oturumda tutup
 * sihirbaza taşıyor, orada önceden dolu geliyor. Sebep: `ownerUid` gerekiyor
 * ve kullanıcının hesabı henüz yok; ayrıca tarih/konum gibi alanlar da
 * sihirbazda toplanıyor, iki ayrı yaratma yolu tutmak anlamsız.
 *
 * İstemciden gelene güvenilmeyen alanlar (bilerek gövdeden okunmuyor):
 *   code             → sunucu üretiyor
 *   ownerUid         → oturumdan geliyor
 *   status           → her etkinlik "taslak" doğuyor
 *   moderationMode   → CLAUDE.md kural 8: manuel onayla başlıyor
 *   creditsPerGuest  → sabit 3
 */

const MAX_NAME_LENGTH = 80;
const CREDITS_PER_GUEST = 3;

/**
 * `2026-11-14` + `18:00` + `02:00` → etkinlik penceresi.
 *
 * Bitiş başlangıçtan önceyse ertesi güne taşınıyor: düğün 20:00'de başlayıp
 * 02:00'de bitiyor, gece yarısını aşmak normal.
 *
 * +03:00 sabit — Türkiye yaz saati uygulamıyor.
 */
function toEventWindow(
  date: unknown,
  startTime: unknown,
  endTime: unknown,
): { startsAt: string | null; endsAt: string | null; error?: string } {
  if (typeof date !== "string" || date.length === 0) {
    return { startsAt: null, endsAt: null };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { startsAt: null, endsAt: null, error: "Tarih geçersiz." };
  }
  if (typeof startTime !== "string" || !/^\d{2}:\d{2}$/.test(startTime)) {
    return { startsAt: null, endsAt: null, error: "Başlangıç saati geçersiz." };
  }

  const start = new Date(`${date}T${startTime}:00+03:00`);
  if (Number.isNaN(start.getTime())) {
    return { startsAt: null, endsAt: null, error: "Tarih geçersiz." };
  }

  let end: Date | null = null;
  if (typeof endTime === "string" && /^\d{2}:\d{2}$/.test(endTime)) {
    end = new Date(`${date}T${endTime}:00+03:00`);
    if (end <= start) end = new Date(end.getTime() + 86_400_000);
  }

  return { startsAt: start.toISOString(), endsAt: end?.toISOString() ?? null };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { name, typeId, guestRange, date, startTime, endTime, expectedGuests, locationName, planId } =
    (body ?? {}) as Record<string, unknown>;

  /**
   * Sihirbazda Paket adımı, etkinliği yaratan adımdan ÖNCE geliyor; seçim bu
   * istekle birlikte ulaşıyor. Burada kaydedilmezse kullanıcı paketi seçtiği
   * halde sihirbaz her açılışta yeniden soruyordu (planId hep null kalıyordu).
   * Geçersiz/boş değer null: paket seçilmeden de etkinlik yaratılabiliyor.
   */
  const chosenPlan = isPlanId(planId) ? planId : null;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (trimmedName.length === 0 || trimmedName.length > MAX_NAME_LENGTH) {
    return Response.json(
      { error: "Etkinlik adı gerekli (en fazla 80 karakter)." },
      { status: 400 },
    );
  }

  // Tür ve aralık serbest metin değil, bilinen listeden olmak zorunda
  if (
    typeof typeId !== "string" ||
    !eventTypes.some((t) => t.id === typeId)
  ) {
    return Response.json({ error: "Etkinlik türü geçersiz." }, { status: 400 });
  }
  /**
   * `guestRange` OPSİYONEL. Landing akışından geliyorsa dolu; kullanıcı doğrudan
   * sihirbazdan başladıysa yok, o zaman girdiği kesin sayıdan türetiyoruz.
   */
  const guests = Number(expectedGuests);
  const hasGuestCount = Number.isFinite(guests) && guests > 0;

  let range: string;
  if (typeof guestRange === "string" && guestRanges.some((r) => r.id === guestRange)) {
    range = guestRange;
  } else if (hasGuestCount) {
    range = guests < 50 ? "0-50" : guests <= 250 ? "50-250" : "250+";
  } else {
    return Response.json(
      { error: "Katılımcı sayısı ya da aralığı gerekli." },
      { status: 400 },
    );
  }

  // Sihirbazın 1. adımı tarih ve saat de topluyor; ikisi birlikte gelmek zorunda
  const eventWindow = toEventWindow(date, startTime, endTime);
  if (eventWindow.error) {
    return Response.json({ error: eventWindow.error }, { status: 400 });
  }

  try {
    const db = getDb();
    const ref = db.collection(paths.events).doc();
    const code = await generateUniqueEventCode();

    const event: EventDoc = {
      id: ref.id,
      ownerUid: user.uid,
      name: trimmedName,
      code,
      typeId,
      guestRange: range,
      status: "taslak",
      // CLAUDE.md kural 8: yeni etkinlikler manuel onay modunda başlar
      moderationMode: "manuel",
      creditsPerGuest: CREDITS_PER_GUEST,
      startsAt: eventWindow.startsAt,
      endsAt: eventWindow.endsAt,
      expectedGuests: hasGuestCount ? Math.round(guests) : null,
      locationName:
        typeof locationName === "string" && locationName.trim()
          ? locationName.trim().slice(0, 120)
          : null,
      stageTemplateId: null,
      stageMode: null,
      stageReferenceKind: null,
      stageReferenceShape: null,
      stageReferenceKey: null,
      missionSubject: null,
      missionTone: null,
      missionTheme: null,
      missionFacts: [],
      planId: chosenPlan,
      /**
       * Ödeme yapılmadı. Bu hâlde MİSAFİR GİREMEZ (QR basılabilir) ve
       * panelin görev/akış/sahne/galeri/ekip sayfaları kilitli.
       */
      paid: false,
      paidAt: null,
      // Bu isteği Etkinlik Bilgileri adımı doğuruyor; paket de seçilmişse o
      // adım da bitmiş sayılır — sihirbaz açılış adımını bu listeden seçiyor
      completedSteps: chosenPlan ? ["paket", "bilgiler"] : ["bilgiler"],
      createdAt: new Date().toISOString(),
    };

    /**
     * Etkinlik + görevleri TEK batch'te yazıyoruz.
     *
     * Ayrı ayrı yazsak ve ikincisi patlasa, görevsiz bir etkinlik kalırdı —
     * misafir QR'ı okutup boş ekran görürdü. Batch atomik: ya hepsi ya hiçbiri.
     *
     * Görevler şablon havuzundan KOPYALANIYOR (CLAUDE.md veri modeli).
     * Kopya olduğu için organizatör düzenlediğinde havuz bozulmuyor.
     */
    const batch = db.batch();
    batch.set(ref, event);

    const templates = templatesForType(typeId);
    const missionsRef = db.collection(paths.missions(ref.id));

    templates.forEach((template, index) => {
      const mission: MissionDoc = {
        id: template.id,
        label: template.label,
        source: template.source,
        active: template.defaultActive,
        completions: 0,
        order: index,
        // Şablon görevleri hazır onaylı; sadece AI ürettikleri onay bekliyor
        pendingApproval: false,
        createdAt: event.createdAt,
      };
      // Şablon id'sini doküman id'si yapıyoruz: aynı şablon iki kez
      // kopyalanırsa çoğalmıyor, üzerine yazıyor.
      batch.set(missionsRef.doc(template.id), mission);
    });

    await batch.commit();

    return Response.json(
      { event, missionCount: templates.length },
      { status: 201 },
    );
  } catch (error) {
    console.error("etkinlik oluşturulamadı:", error);
    return Response.json(
      { error: "Etkinlik oluşturulamadı, tekrar deneyin." },
      { status: 500 },
    );
  }
}
