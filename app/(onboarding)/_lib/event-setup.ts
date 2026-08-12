/**
 * Etkinlik kurulum akışının içeriği ve tipleri.
 *
 * Kopya metinler burada toplu duruyor; UI componentleri metin barındırmıyor.
 * Backend geldiğinde bu dosya olduğu gibi kalır, sadece `createEvent` /
 * `checkEmail` stub'ları gerçek çağrılarla değişir (bkz. ./api.ts).
 */

export type EventTypeId = "dugun" | "kurumsal" | "parti" | "festival";

export type EventType = {
  id: EventTypeId;
  /** Chip üzerinde ve cümlede görünen etiket */
  label: string;
  /** Sayfa ışımasının ve cümle değerlerinin rengi */
  accent: string;
  /** 3. satırın başı — "Gecemizin adı" bir lansman için tuhaf kaçıyor */
  nameLabel: string;
  namePlaceholder: string;
};

/**
 * DİKKAT: Tasarımda yalnızca "Düğün & Nişan" seçili hâli var. Onun altın
 * tonu ekran görüntüsünden ölçüldü. Diğer üç türün rengi ve `nameLabel`
 * kopyası benim önerim — onay bekliyor.
 */
export const eventTypes: EventType[] = [
  {
    id: "dugun",
    label: "Düğün & Nişan",
    accent: "var(--color-accent-wedding)",
    nameLabel: "Gecemizin adı",
    namePlaceholder: "örn: Zeynep & Can Düğünü",
  },
  {
    id: "kurumsal",
    label: "Kurumsal & Lansman",
    accent: "var(--color-accent-corporate)",
    nameLabel: "Etkinliğimizin adı",
    namePlaceholder: "örn: 2027 Ürün Lansmanı",
  },
  {
    id: "parti",
    label: "Parti & Kutlama",
    accent: "var(--color-accent-party)",
    nameLabel: "Gecemizin adı",
    namePlaceholder: "örn: Ahmet'in Bekarlığa Veda Partisi",
  },
  {
    id: "festival",
    label: "Festival & Konser",
    accent: "var(--color-accent-festival)",
    nameLabel: "Etkinliğimizin adı",
    namePlaceholder: "örn: Bahar Festivali 2027",
  },
];

export type GuestRangeId = "0-50" | "50-250" | "250+";

export const guestRanges: { id: GuestRangeId; label: string }[] = [
  { id: "0-50", label: "50'den az" },
  { id: "50-250", label: "50-250" },
  { id: "250+", label: "250+" },
];

/** Her adımın cümle altında görünen italik açıklaması. */
export const stepHints = {
  type: "“Misafirlerinize sunulacak arayüzün ruhunu ve etkileşim dilini belirler.”",
  guests: "“Sunucu kapasitesini şovunuza özel hazırlamamız için gereklidir.”",
  name: "Misafirleriniz masadaki QR kodu okuttuğunda karşılama ekranında bu isimle ağırlanacak.",
} as const;

export type EventDraft = {
  type: EventType | null;
  guests: GuestRangeId | null;
  name: string;
};

export const emptyDraft: EventDraft = {
  type: null,
  guests: null,
  name: "",
};

export function findGuestRange(id: GuestRangeId | null) {
  return guestRanges.find((r) => r.id === id) ?? null;
}
