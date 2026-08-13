/**
 * Sahne şablonları — büyük ekrana yansıyan görsel düzenler.
 *
 * PAKETE GÖRE KISITLI. Ve dikkat: kısıt kapsayan değil, AYIRAN.
 * Essential bir grubu görüyor, Professional/Enterprise bambaşka bir grubu.
 * Yani "üst paket her şeyi kapsar" modeli DEĞİL — iki farklı deneyim.
 *
 * Sonucu: Essential'da şablon seçmiş biri Professional'a yükselince seçtiği
 * şablonu kaybediyor. `isTemplateAllowed` ile bu durum yakalanıyor ve panel
 * "paketinizde bu şablon yok, yeniden seçin" diyor — sessizce bozuk bir
 * sahneyle canlıya çıkmasın.
 */

export type StageMode =
  /** Fotoğraflar birleşip bir hedef görseli oluşturuyor — referans gerekiyor */
  | "mozaik"
  /** Serbest akan düzen — hedef görsel yok */
  | "akis";

export type StageTemplate = {
  id: string;
  name: string;
  description: string;
  mode: StageMode;
  /** Bu şablonu kullanabilen paketler */
  plans: string[];
};

const ESSENTIAL = ["essential"];
const UPPER = ["professional", "enterprise"];

/**
 * Sahne MODU — sihirbazın Sahne adımında seçiliyor.
 *
 * Şablonun kendisi Sahne sayfasında seçiliyor; sihirbaz sadece "salonda ne
 * görünsün" sorusunu soruyor. Tasarımın bilgi notu da bunu söylüyor:
 * "Mozaiğin nasıl oluşacağını ... Sahne sayfasından seçebilirsin."
 *
 * Modlar paket gruplarıyla birebir örtüşüyor: Essential'ın şablonlarının
 * hepsi akış, üst paketlerin hepsi mozaik.
 */
export const stageModes: {
  id: StageMode;
  name: string;
  description: string;
  featured?: boolean;
  plans: string[];
}[] = [
  {
    id: "mozaik",
    name: "Mozaik Portre",
    description: "Fotoğraflar birleşip seçtiğin görseli oluşturur.",
    featured: true,
    plans: UPPER,
  },
  {
    id: "akis",
    name: "Ambiyans & Akış",
    description: "Hedef görsel olmadan akan fon ve odak ekranları.",
    plans: ESSENTIAL,
  },
];

export function modesForPlan(planId: string | null) {
  if (!planId) return stageModes;
  return stageModes.filter((m) => m.plans.includes(planId));
}

/** Kilitli mod gösterimi de asimetrik: sadece Essential görüyor. */
export function lockedModesForPlan(planId: string | null) {
  if (planId !== "essential") return [];
  return stageModes.filter((m) => !m.plans.includes("essential"));
}

/** Paketin modu — her paketin tek modu var, sihirbaz onu ön seçili getiriyor. */
export function defaultModeForPlan(planId: string | null): StageMode | null {
  return modesForPlan(planId)[0]?.id ?? null;
}

export const stageTemplates: StageTemplate[] = [
  // --- Essential grubu: serbest akan düzenler ------------------------------
  {
    id: "organik-kolaj",
    name: "Organik Kolaj",
    description: "Düzensiz boyutlu kareler",
    mode: "akis",
    plans: ESSENTIAL,
  },
  {
    id: "foto-bulutu",
    name: "Foto Bulutu",
    description: "Merkeze yakınsayan düzen",
    mode: "akis",
    plans: ESSENTIAL,
  },
  {
    id: "polaroid-yigini",
    name: "Polaroid Yığını",
    description: "Masaya düşen anı kartları",
    mode: "akis",
    plans: ESSENTIAL,
  },
  {
    id: "3d-karusel",
    name: "3D Karusel",
    description: "Perspektifte dönen halka",
    mode: "akis",
    plans: ESSENTIAL,
  },

  // --- Professional / Enterprise grubu: hedef görsel oluşturanlar ----------
  {
    id: "mozaik-portre",
    name: "Mozaik Portre",
    description: "Fotoğraflar birleşip tek görsel olur",
    mode: "mozaik",
    plans: UPPER,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Tek büyük kare, yavaş zoom",
    mode: "mozaik",
    plans: UPPER,
  },
  {
    id: "zaman-tuneli",
    name: "Zaman Tüneli",
    description: "Saat bandında ilerleyen anlar",
    mode: "mozaik",
    plans: UPPER,
  },
];

export function findStageTemplate(id: string | null) {
  return id ? (stageTemplates.find((t) => t.id === id) ?? null) : null;
}

/**
 * Paketin kullanabileceği şablonlar.
 *
 * Paket HENÜZ SEÇİLMEMİŞSE hepsini döndürüyoruz. Sebep akış sırası: sihirbazda
 * Sahne 2. adım, Paket 4. adım — yani kullanıcı paketi seçmeden buraya geliyor.
 * Hepsini gösterip "paket seçilince liste daralacak" demek, boş bir ekran
 * göstermekten iyi. Kaydedilen şablon pakete uymuyorsa panel uyarıyor.
 */
export function templatesForPlan(
  planId: string | null,
  mode?: StageMode | null,
): StageTemplate[] {
  let list = planId
    ? stageTemplates.filter((t) => t.plans.includes(planId))
    : stageTemplates;
  // Sihirbazda mod seçildiyse Sahne sayfası da ona göre daralıyor
  if (mode) list = list.filter((t) => t.mode === mode);
  return list;
}

/**
 * Paketin dışında kalan ama KİLİTLİ OLARAK GÖSTERİLECEK şablonlar.
 *
 * ASİMETRİK — bilinçli:
 *   Essential  → üst paketin şablonlarını kilitli görüyor (yükseltme daveti)
 *   Üst paket  → Essential'ın şablonlarını HİÇ görmüyor (boş dizi)
 *
 * Sebep: alt pakete "yükseltirsen bunlar açılır" demek satış; üst pakete
 * "alt paketin basit şablonları da var" demek gereksiz gürültü.
 */
export function lockedTemplatesForPlan(planId: string | null): StageTemplate[] {
  if (planId !== "essential") return [];
  return stageTemplates.filter((t) => !t.plans.includes("essential"));
}

export function isTemplateAllowed(
  templateId: string | null,
  planId: string | null,
): boolean {
  if (!templateId) return true;
  const template = findStageTemplate(templateId);
  if (!template) return false;
  if (!planId) return true;
  return template.plans.includes(planId);
}

/** Mozaik referansı sadece hedef görsel oluşturan şablonlarda kullanılıyor. */
export function needsReference(templateId: string | null): boolean {
  return findStageTemplate(templateId)?.mode === "mozaik";
}

/** Referans türleri — tasarımdaki üç sekme. */
export const referenceKinds = [
  { id: "sekil", label: "Hazır Şekil" },
  { id: "logo", label: "Logo (PNG)" },
  { id: "foto", label: "Referans Fotoğraf" },
] as const;

export type ReferenceKind = (typeof referenceKinds)[number]["id"];

/** "Hazır Şekil" seçenekleri. Mozaiğin dolduracağı siluet. */
export const referenceShapes = [
  { id: "kalp", label: "Kalp" },
  { id: "yildiz", label: "Yıldız" },
  { id: "daire", label: "Daire" },
  { id: "sonsuzluk", label: "Sonsuzluk" },
] as const;
