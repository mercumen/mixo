import type { EventDoc, MissionDoc } from "@/lib/schema";

/**
 * ORGANİZASYONA HAZIRLIK REHBERİ — ödeme sonrası Genel Bakış'ın ortasındaki
 * görev listesi.
 *
 * Panel öğrenmesi zor; bu rehber "şimdi ne yapmalıyım?" sorusunu sırayla
 * cevaplıyor: QR bas → görevleri hazırla → sahneyi seç → moderasyonu belirle
 * → ekranı test et → telefonla prova yap.
 *
 * TEMEL KURAL: adımlar kullanıcıya kutu İŞARETLETMİYOR. Her adımın gerçek
 * bir sinyali var — üçü veriden kendiliğinden anlaşılıyor (görev havuzu,
 * sahne seçimi, misafir aktivitesi), üçü tek tıkla kaydediliyor (QR indirme,
 * moderasyon kararı, ekran testi). Kayıt `guideDone` dizisinde.
 */

export const GUIDE_STEPS = [
  "qr",
  "gorevler",
  "sahne",
  "moderasyon",
  "ekran",
  "telefon",
] as const;

export type GuideStepId = (typeof GUIDE_STEPS)[number];

/** Tek tıkla kaydedilenler — uç yalnızca bunları kabul ediyor. */
export const MANUAL_STEPS: GuideStepId[] = ["qr", "moderasyon", "ekran"];

/** "Hepsi bitti" kartının kapatılması da kalıcı — sahte adım olarak duruyor. */
export const GUIDE_DISMISSED = "gizli";

/** Görev havuzu bu sayının altındaysa "hazır" saymıyoruz. */
const MIN_ACTIVE_MISSIONS = 5;

export type GuideStep = {
  id: GuideStepId;
  title: string;
  description: string;
  /** Eylem düğmesinin gideceği yer (varsa) */
  href?: string;
  done: boolean;
};

/**
 * Rehberin durumunu hesaplar.
 *
 * Bilerek SAF bir fonksiyon: Firestore'a kendisi gitmiyor, sayfanın zaten
 * çektiği veriyi alıyor. Genel Bakış görevleri her halükârda yüklüyor;
 * ikinci kez okumak kota israfı olurdu (CLAUDE.md okuma bütçesi).
 */
export function computeGuide(input: {
  event: EventDoc;
  missions: MissionDoc[];
  /** En az bir misafir oturumu/fotoğrafı var mı */
  hasGuestActivity: boolean;
}): GuideStep[] {
  const { event, missions, hasGuestActivity } = input;
  const done = new Set(event.guideDone ?? []);

  const activeMissions = missions.filter(
    (m) => m.active && !m.pendingApproval,
  ).length;
  const pendingAi = missions.filter((m) => m.pendingApproval).length;

  return [
    {
      id: "qr",
      title: "QR kodlarını yazdır",
      description:
        "Masalara koyacağın kartları indir ve bastır. Baskı en uzun süren iş — erken başla.",
      done: done.has("qr"),
    },
    {
      id: "gorevler",
      title: "Görev havuzunu hazırla",
      description:
        pendingAi > 0
          ? `Onay bekleyen ${pendingAi} AI görevi var — değerlendir.`
          : `Misafirlerin göreceği görevleri gözden geçir (en az ${MIN_ACTIVE_MISSIONS} aktif görev önerilir).`,
      href: "/dashboard/gorevler",
      done: activeMissions >= MIN_ACTIVE_MISSIONS && pendingAi === 0,
    },
    {
      id: "sahne",
      title: "Sahneni seç",
      description: "Büyük ekranda hangi görsel deneyimin döneceğini belirle.",
      href: "/dashboard/sahne",
      done: event.stageTemplateId !== null,
    },
    {
      id: "moderasyon",
      title: "Moderasyon şeklini belirle",
      description:
        "Fotoğrafları elle mi onaylayacaksın, yapay zekaya mı bırakacaksın?",
      href: "/dashboard/canli-akis",
      done: done.has("moderasyon"),
    },
    {
      id: "ekran",
      title: "Ekranı aç ve test et",
      description:
        "Sahne bağlantısını laptopta aç, HDMI ile ekrana yansıt. Bağlantıyı şimdiden kaydet.",
      done: done.has("ekran"),
    },
    {
      id: "telefon",
      title: "Telefonla prova yap",
      description: hasGuestActivity
        ? "İlk fotoğraf düştü — uçtan uca akış çalışıyor."
        : "QR'ı kendi telefonunla okut, bir görev tamamla, fotoğrafın ekrana düşsün.",
      done: hasGuestActivity,
    },
  ];
}
