import { eventTypes } from "@/app/(onboarding)/_lib/event-setup";
import type { EventStatus } from "@/lib/schema";

/**
 * Firestore'daki ham veriyi ekranda görünecek hâle çeviren yardımcılar.
 *
 * Mock veride hazır string'ler vardı (`dateLabel: "16 Ağustos 2026"`);
 * gerçek dokümanda ISO tarih var. Biçimlendirme tek yerde toplansın diye burada.
 *
 * `tr-TR` sabit: tarayıcı diline bırakırsak sunucu ve istemci farklı biçim
 * üretip hydration uyuşmazlığı çıkarıyor.
 */

const longDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const shortDateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

/**
 * Tarih alanları NULL OLABİLİR: kurulum akışı tarih sormuyor, panelin
 * Kurulum Sihirbazı adımında giriliyor. Boş hâli sessizce "—" göstermek
 * yerine ne yapılması gerektiğini söylüyoruz.
 */
export function formatLongDate(iso: string | null): string {
  if (!iso) return "Tarih belirlenmedi";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Tarih belirlenmedi" : longDate.format(d);
}

export function formatShortDateTime(iso: string | null): string {
  if (!iso) return "Tarih belirlenmedi";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Tarih belirlenmedi";
  // Intl "14 Ağu 2026, 18:00" üretiyor; tasarımdaki ayraç "•"
  return shortDateTime.format(d).replace(",", " •");
}

export const statusLabels: Record<EventStatus, string> = {
  taslak: "Taslak",
  canli: "Canlı",
  bitti: "Bitti",
};

export function eventTypeLabel(typeId: string): string {
  return eventTypes.find((t) => t.id === typeId)?.label ?? "Etkinlik";
}

/**
 * Etkinliğe kalan süre.
 *
 * `unset`: tarih hiç girilmemiş — "geçmiş" ile karıştırılmamalı, panelde
 * farklı mesaj gösteriliyor.
 */
export function countdownTo(iso: string | null, now = Date.now()) {
  if (!iso) {
    return { days: 0, hours: 0, minutes: 0, past: false, unset: true };
  }
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, past: false, unset: true };
  }

  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, past: true, unset: false };

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    past: false,
    unset: false,
  };
}

// Kurulum ilerlemesi hesabı buradan kaldırıldı: tek kaynak lib/setup-steps.ts
// (`progressFromSteps`). Modal'ın rayı ve Genel Bakış aynı yerden besleniyor.
