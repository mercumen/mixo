"use client";

/**
 * Landing'deki cümle akışının cevaplarını Kurulum Sihirbazı'na taşır.
 *
 * NEDEN OTURUM DEPOSU: landing'de etkinlik YARATILMIYOR — kullanıcının henüz
 * hesabı yok. Cevaplar hesap açılana kadar tarayıcıda bekliyor, sihirbazın
 * 1. adımı onları önceden dolu gösteriyor ve etkinlik oradan doğuyor.
 *
 * `sessionStorage` seçildi, `localStorage` değil: bu veri tek oturumluk bir
 * niyet. Kullanıcı yarın panele girdiğinde eski bir taslağın formu
 * doldurması istenmeyen bir davranış olurdu.
 */

const KEY = "mixo:event-draft";

export type StoredEventDraft = {
  name: string;
  typeId: string;
  guestRange: string;
  /** Landing'de paket de seçiliyor; sihirbaz 1. adımı atlayıp 2'den başlıyor */
  planId: string;
};

export function saveEventDraft(draft: StoredEventDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Gizli sekme / depolama kapalı: taslak kaybolur, sihirbaz boş açılır.
    // Akışı kırmıyor, o yüzden sessizce geçiyoruz.
  }
}

export function readEventDraft(): StoredEventDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEventDraft>;
    if (typeof parsed?.name !== "string" || typeof parsed?.typeId !== "string") {
      return null;
    }
    return {
      name: parsed.name,
      typeId: parsed.typeId,
      guestRange: typeof parsed.guestRange === "string" ? parsed.guestRange : "",
      planId: typeof parsed.planId === "string" ? parsed.planId : "",
    };
  } catch {
    return null;
  }
}

/** Etkinlik yaratıldıktan sonra taslağın işi bitti. */
export function clearEventDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // önemsiz
  }
  snapshot = undefined;
}

/* ---------------------------------------------------------------------------
   React `useSyncExternalStore` köprüsü.

   Taslağı render sırasında okumak sunucu/istemci uyuşmazlığı yaratıyordu
   (sunucuda sessionStorage yok). `useSyncExternalStore` sunucu ve istemci için
   ayrı snapshot alabildiği için doğru araç.

   ÖNBELLEK ŞART: `getSnapshot` her çağrıda yeni bir nesne dönerse React
   "değişti" sanıp sonsuz render döngüsüne girer. Taslak oturum içinde
   değişmediği için bir kez okuyup saklıyoruz.
--------------------------------------------------------------------------- */

let snapshot: StoredEventDraft | null | undefined;

export function getEventDraftSnapshot(): StoredEventDraft | null {
  if (snapshot === undefined) snapshot = readEventDraft();
  return snapshot;
}

/** Taslak oturum içinde değişmiyor; abone olacak bir şey yok. */
export function subscribeToEventDraft(): () => void {
  return () => {};
}
