/**
 * Paketler — tek kaynak.
 *
 * Üç yerde birden kullanılıyor: landing'in paket adımı, Kurulum Sihirbazı'nın
 * 1. adımı ve Ayarlar → Plan sekmesi. Ayrıca sahne şablonlarının hangi paketle
 * açıldığı da buna bağlı (bkz. lib/stage-templates.ts).
 *
 * Fiyatlar tasarımdan. Ödeme entegrasyonu CLAUDE.md'de kapsam dışı (v2), o
 * yüzden paket seçimi şimdilik sadece bir kayıt — tahsilat yok.
 */

export type PlanId = "essential" | "professional" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  /** Tasarımdaki fiyat metni. Enterprise'da sayı yok. */
  priceLabel: string;
  priceSuffix?: string;
  description: string;
  /** Özellik listesinin üstündeki satır */
  featuresLead: string;
  features: string[];
  /** "En Çok Tercih Edilen" şeridi */
  popular?: boolean;
  /** Fiyatı görüşmeye bağlı olanlar seçilemez, iletişime yönlendiriyor */
  contactOnly?: boolean;
};

export const plans: Plan[] = [
  {
    id: "essential",
    name: "Essential",
    priceLabel: "₺ 2.500",
    priceSuffix: "/ etkinlik",
    description: "Etkileşimli etkinlik deneyimine hızlı ve kolay başlangıç.",
    featuresLead: "Dahil Olan Özellikler",
    features: [
      "QR ile katılım",
      "Manuel Görev Oluşturma",
      "Fotoğraf Yükleme",
      "Canlı Mozaik",
      "Etkinlik Analizi",
      "Dijital Galeri",
      "Standart Destek",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "₺ 5.900",
    priceSuffix: "/ etkinlik",
    description:
      "Yapay zekâ destekli katılımcı deneyimi ve gelişmiş etkinlik yönetimi.",
    featuresLead: "Essential'daki tüm özelliklere ek olarak",
    features: [
      "Kişiselleştirilmiş Yapay Zekâ Görevleri",
      "Yapay Zekâ İçerik Moderasyonu",
      "Canlı Görsel Deneyimleri",
      "Gelişmiş Etkinlik Analizi",
      "Markaya Özel Deneyim",
      "Öncelikli Destek",
      "Genişletilmiş Dijital Arşiv",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Özel Fiyat",
    description:
      "Büyük ölçekli etkinlikler ve kurumsal projeler için tamamen özelleştirilebilir çözüm.",
    featuresLead: "Professional'daki tüm özelliklere ek olarak",
    features: [
      "White Label",
      "Tamamen Özelleştirilebilir Görsel Deneyimler",
      "Özel Tasarım Desteği",
      "Kuruma Özel Geliştirmeler",
      "Gelişmiş Teknik Analiz",
      "Öncelikli Teknik Destek",
    ],
    contactOnly: true,
  },
];

export function findPlan(id: string | null): Plan | null {
  return id ? (plans.find((p) => p.id === id) ?? null) : null;
}

/**
 * AI görev üretimi hangi paketlerde açık?
 *
 * Essential'da havuz ELLE dolduruluyor: etkinlik tipine göre kopyalanan
 * hazır şablonlar + organizatörün manuel eklediği görevler. Üst paketlerde
 * bunun üstüne AI üretimi geliyor.
 *
 * Bilinmeyen/boş paket `false` sayılıyor — paket seçilmeden AI çalışmıyor,
 * çünkü ücretli bir çağrıyı paketsiz bir kayda bağlamak istemiyoruz.
 */
export function planHasAiMissions(planId: string | null): boolean {
  return planId === "professional" || planId === "enterprise";
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && plans.some((p) => p.id === value);
}
