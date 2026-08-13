/**
 * AI görev üretiminde kullanılan ton seçenekleri.
 *
 * TASARIM NOTU: attığın ekran görüntüsünde dört kartın da başlığı "Zarif"
 * yazıyordu ama alt satırları farklıydı ("Sofistike ve Davetkar", "Enerjik ve
 * Neşeli", "Zekice ve Şık", "Kısa ve Net"). Bu Figma'da kopyala-yapıştır
 * kalıntısı gibi duruyor — alt satırlardan türeterek başlıkları yazdım.
 * Yanlışsa buradan düzeltilir.
 */

export type MissionTone = {
  id: string;
  label: string;
  hint: string;
  /** Karttaki küçük ikon rengi — hepsi aynı olunca kartlar ayrışmıyor */
  accent: string;
};

export const missionTones: MissionTone[] = [
  {
    id: "zarif",
    label: "Zarif",
    hint: "Sofistike ve Davetkâr",
    accent: "text-rose-500",
  },
  {
    id: "eglenceli",
    label: "Eğlenceli",
    hint: "Enerjik ve Neşeli",
    accent: "text-amber-500",
  },
  {
    id: "esprili",
    label: "Esprili",
    hint: "Zekice ve Şık",
    accent: "text-violet-500",
  },
  {
    id: "sade",
    label: "Sade",
    hint: "Kısa ve Net",
    accent: "text-sky-500",
  },
];

export function isMissionTone(value: unknown): boolean {
  return typeof value === "string" && missionTones.some((t) => t.id === value);
}
