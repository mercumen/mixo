import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findEventByCode } from "@/lib/guest-session";
import { GardenStage } from "./_components/garden-stage";
import "./display.css";

/**
 * EKRAN UYGULAMASI — laptop → HDMI → TV.
 *
 * CLAUDE.md: "Ekran ayrı bir uygulamadır", organizatör panelinin sekmesi
 * değil. Oturum açmıyor, klavye istemiyor, saatlerce dönüyor.
 *
 * Kod → etkinlik çözümü SUNUCUDA yapılıyor: `events` koleksiyonunda sorgu
 * yapmak Security Rules'ta anonim istemciye kapalı (ve kapalı kalmalı).
 * İstemciye sadece etkinlik kimliği geçiyor; oradan tek dokümanı dinliyor.
 */

export const metadata: Metadata = {
  title: "Anı Bahçesi",
  robots: { index: false, follow: false },
};

/** Finalde yazılacak isim: "Elif & Can Düğünü" → "Elif & Can". */
function finaleName(eventName: string): string {
  return (
    eventName
      .replace(/\s+(Düğünü|Düğün|Nişanı|Nişan|Partisi|Gecesi|Balosu)\s*$/iu, "")
      .trim() || eventName
  );
}

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const event = await findEventByCode(kod);

  // Yanlış kodda panel/hata sayfası değil sade 404 — ekran anonim bir yüzey
  if (!event) notFound();

  return <GardenStage eventId={event.id} finaleName={finaleName(event.name)} />;
}
