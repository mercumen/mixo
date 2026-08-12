/**
 * Görev havuzu şablonları — etkinlik tipine göre.
 *
 * CLAUDE.md'nin tarif ettiği akış: bu şablonlar `missionTemplates`
 * koleksiyonunda duruyor, etkinlik yaratılırken `events/{id}/missions` altına
 * KOPYALANIYOR. Kopya olması önemli — organizatör kendi etkinliğindeki görevi
 * düzenlediğinde havuzu bozmuyor.
 *
 * Metinler tasarımdaki örneklerin tonunda: emir kipi, tek cümle, misafirin
 * ne çekeceğini net söylüyor. Uzun görev masada okunmuyor.
 *
 * Bu liste `source: "sablon"` olarak işaretli geliyor. Organizatörün elle
 * eklediği görevler `"manuel"`, AI'ın ürettiği `"ai"` olacak.
 */

import type { MissionSource } from "@/lib/schema";

export type MissionTemplate = {
  id: string;
  /** Hangi etkinlik tipinde havuza giriyor */
  typeId: string;
  label: string;
  /** Varsayılan olarak açık mı — havuz geniş, hepsi açık başlamıyor */
  defaultActive: boolean;
  source: MissionSource;
};

const dugun: Omit<MissionTemplate, "typeId" | "source">[] = [
  { id: "dugun-dans", label: "En çılgın dans pozunu çek!", defaultActive: true },
  { id: "dugun-ilk-bakis", label: "Damadın ailesiyle ilk bakış anını yakala", defaultActive: true },
  { id: "dugun-nikah-masasi", label: "Nikah masasındaki mutluluk anını yakala", defaultActive: true },
  { id: "dugun-yuzuk", label: "Nikah yüzüklerinin takıldığı yakın planı çek", defaultActive: true },
  { id: "dugun-duvak", label: "Gelinin duvağını nazikçe düzeltirken onu çek", defaultActive: true },
  { id: "dugun-buket", label: "Gelin buketinin en güzel açısını bul", defaultActive: true },
  { id: "dugun-masa", label: "Masanızdaki en komik anı yakala", defaultActive: true },
  { id: "dugun-pasta", label: "Pastanın kesildiği anı yakala", defaultActive: false },
  { id: "dugun-dede", label: "Gelinle dedesinin dans ettiği kareyi çek", defaultActive: false },
  { id: "dugun-kahkaha", label: "Misafirlerin en samimi kahkahasını yakala", defaultActive: false },
  { id: "dugun-gece", label: "Gece gökyüzü altında bir çift fotoğrafı çek", defaultActive: false },
  { id: "dugun-cicek", label: "Masadaki çiçek süslemesiyle yaratıcı bir kare çek", defaultActive: false },
];

const kurumsal: Omit<MissionTemplate, "typeId" | "source">[] = [
  { id: "kurumsal-ekip", label: "Ekibinizle bir kare çekin", defaultActive: true },
  { id: "kurumsal-sahne", label: "Sahnedeki en etkileyici anı yakala", defaultActive: true },
  { id: "kurumsal-logo", label: "Marka alanında bir fotoğraf çek", defaultActive: true },
  { id: "kurumsal-tanisma", label: "Bugün tanıştığın biriyle poz ver", defaultActive: true },
  { id: "kurumsal-urun", label: "Tanıtılan ürünle bir kare çek", defaultActive: true },
  { id: "kurumsal-kokteyl", label: "Kokteyl alanındaki atmosferi yakala", defaultActive: true },
  { id: "kurumsal-not", label: "En çok not aldığın anı fotoğrafla", defaultActive: false },
  { id: "kurumsal-alkis", label: "Alkış anını yakala", defaultActive: false },
];

const parti: Omit<MissionTemplate, "typeId" | "source">[] = [
  { id: "parti-poz", label: "En abartılı poz denemesini çek!", defaultActive: true },
  { id: "parti-grup", label: "Masandaki herkesle tek karede buluş", defaultActive: true },
  { id: "parti-dans", label: "Dans pistindeki en enerjik anı yakala", defaultActive: true },
  { id: "parti-sasirtma", label: "Birini gafil avla, tepkisini çek", defaultActive: true },
  { id: "parti-kutlama", label: "Kutlama anını havada yakala", defaultActive: true },
  { id: "parti-selfie", label: "Gecenin en kalabalık selfie'sini çek", defaultActive: true },
  { id: "parti-detay", label: "Süslemelerden en sevdiğin detayı çek", defaultActive: false },
  { id: "parti-ayakkabi", label: "Gecenin en iyi ayakkabısını fotoğrafla", defaultActive: false },
];

const festival: Omit<MissionTemplate, "typeId" | "source">[] = [
  { id: "festival-sahne", label: "Sahneyi arkana alıp bir kare çek", defaultActive: true },
  { id: "festival-kalabalik", label: "Kalabalığın enerjisini tek karede yakala", defaultActive: true },
  { id: "festival-isik", label: "En etkileyici işık anını çek", defaultActive: true },
  { id: "festival-arkadas", label: "Yanındakiyle bir kare çek", defaultActive: true },
  { id: "festival-favori", label: "Favori şarkı çalarken bir fotoğraf çek", defaultActive: true },
  { id: "festival-bileklik", label: "Festival bilekliğini yaratıcı şekilde çek", defaultActive: false },
  { id: "festival-gunbatimi", label: "Gün batımını alanla birlikte çek", defaultActive: false },
];

function withType(
  typeId: string,
  items: Omit<MissionTemplate, "typeId" | "source">[],
): MissionTemplate[] {
  return items.map((m) => ({ ...m, typeId, source: "sablon" as const }));
}

export const missionTemplates: MissionTemplate[] = [
  ...withType("dugun", dugun),
  ...withType("kurumsal", kurumsal),
  ...withType("parti", parti),
  ...withType("festival", festival),
];

export function templatesForType(typeId: string): MissionTemplate[] {
  return missionTemplates.filter((m) => m.typeId === typeId);
}
