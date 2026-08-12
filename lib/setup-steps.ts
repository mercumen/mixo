/**
 * Kurulum Sihirbazı adımları — tek kaynak.
 *
 * Hem modal'ın sol rayı, hem Genel Bakış'taki kontrol listesi, hem de
 * kurulum ilerlemesi yüzdesi buradan besleniyor. Üç yerde ayrı liste
 * tutmak, birinde adım eklendiğinde diğerlerinin sessizce yanlış kalması
 * demek olurdu.
 */

export const setupStepIds = [
  "bilgiler",
  "sahne",
  "gorevler",
  "paket",
  "ekip",
] as const;

export type SetupStepId = (typeof setupStepIds)[number];

export type SetupStepMeta = {
  id: SetupStepId;
  /** Ray ve kontrol listesindeki başlık */
  title: string;
  /** Rayda başlığın altındaki tek satır */
  hint: string;
  /** Atlanabilir adımlar "Şimdilik Atla" gösteriyor */
  skippable: boolean;
};

export const setupSteps: SetupStepMeta[] = [
  {
    id: "bilgiler",
    title: "Etkinlik Bilgileri",
    hint: "Ad, tür, tarih, misafir, konum",
    // Tarih olmadan geri sayım, sahne açılışı ve davet süreleri hesaplanamıyor
    skippable: false,
  },
  {
    id: "sahne",
    title: "Sahne Görünümü",
    hint: "Mozaik referansı ya da akış şablonu",
    skippable: false,
  },
  {
    id: "gorevler",
    title: "Görev Havuzu",
    hint: "AI ile kişiselleştirilmiş görevler",
    // Atlanabilir: şablon görevleri etkinlik yaratılırken zaten kopyalanıyor
    skippable: true,
  },
  {
    id: "paket",
    title: "Paket",
    hint: "Etkinliğine uygun plan",
    skippable: true,
  },
  {
    id: "ekip",
    title: "Ekip",
    hint: "Birlikte yönetecek moderatörler",
    skippable: true,
  },
];

/** Genel Bakış'taki kontrol listesinde "(isteğe bağlı)" etiketi için. */
export function isOptionalStep(id: SetupStepId) {
  return setupSteps.find((s) => s.id === id)?.skippable ?? false;
}

/** Kurulum ilerlemesi yüzdesi — tamamlanan adım sayısına göre. */
export function progressFromSteps(completed: string[]): number {
  const valid = completed.filter((id) =>
    setupStepIds.includes(id as SetupStepId),
  );
  return Math.round((valid.length / setupStepIds.length) * 100);
}

/** Sırada hangi adım var — tamamlanmamış ilk adım. */
export function nextIncompleteStep(completed: string[]): SetupStepMeta {
  return setupSteps.find((s) => !completed.includes(s.id)) ?? setupSteps[0];
}
