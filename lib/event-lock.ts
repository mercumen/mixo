import type { EventDoc } from "@/lib/schema";

/**
 * ETKİNLİĞİN SABİT ALANLARI — bir kere girilir, sonra değişmez.
 *
 * Ürün kararı (18 Ağustos): organizatör tarihi, türü, katılımcı sayısını ve
 * paketi sonradan değiştiremiyor. Bunlar ticari taahhüt: fiyat pakete,
 * planlama tarihe bağlı. Değişebilen tek şey TEMA ve İÇERİK — sahne şablonu,
 * referans görsel, görevler, isim, moderasyon modu.
 *
 * KİLİT ÖDEMEYE BAĞLI DEĞİL: alan doldurulduğu anda kilitleniyor. "Ödeme
 * sonrası kilitle" önerilmişti ama reddedildi — ödemeden önce de değiştirilip
 * duran bir tarih planlamayı bozuyor.
 *
 * BOŞSA YAZILABİLİR: kurulum sihirbazı bu alanları ilk kez doldururken
 * geçebiliyor. Bir kez dolduktan sonra aynı istek 403 alıyor.
 */

/** Bir kere yazılıp sabitlenen alanlar. */
export const LOCKED_FIELDS = [
  "typeId",
  "guestRange",
  "startsAt",
  "endsAt",
  "expectedGuests",
  "planId",
] as const;

export type LockedField = (typeof LOCKED_FIELDS)[number];

/** Kullanıcıya gösterilecek alan adları — hata mesajları için. */
const LABELS: Record<LockedField, string> = {
  typeId: "Etkinlik türü",
  guestRange: "Katılımcı aralığı",
  startsAt: "Etkinlik tarihi",
  endsAt: "Bitiş saati",
  expectedGuests: "Beklenen katılımcı sayısı",
  planId: "Paket",
};

/** Alan zaten dolu mu? Dolu olan bir daha yazılamıyor. */
export function isFieldSet(event: EventDoc, field: LockedField): boolean {
  const value = event[field];
  return value !== null && value !== undefined && value !== "";
}

/**
 * Etkinliğin çekirdek bilgileri kilitli mi?
 *
 * Panelde "Etkinlik Bilgileri" formunu salt-okunur yapmak ve paket
 * kartlarını hiç göstermemek için kullanılıyor.
 */
export function isEventLocked(event: EventDoc): boolean {
  // Tarih girilmişse kurulum yapılmış sayılıyor — kilidin görünür işareti bu
  return isFieldSet(event, "startsAt");
}

export function lockedFieldLabel(field: LockedField): string {
  return LABELS[field];
}
