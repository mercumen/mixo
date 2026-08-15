import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eventWindowState, findEventByCode } from "@/lib/guest-session";
import { GuestApp } from "./_components/guest-app";

/**
 * Misafir uygulaması — /e/{kod}.
 *
 * QR buraya açılıyor. Auth yok, mobil, tek sayfa; ekranlar arası geçiş
 * istemcide (bkz. guest-app.tsx). Sunucu yalnızca etkinliği bulup adını ve
 * pencere durumunu basıyor — misafirin ilk boyamada beklediği tek şey bu.
 *
 * noindex: 500 davetlinin gireceği sayfa arama motorunun işi değil;
 * kod tahmin edilerek gezilmesin.
 */

export const metadata: Metadata = {
  title: "MIXO",
  robots: { index: false, follow: false },
};

export default async function GuestPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;

  const event = await findEventByCode(kod);
  if (!event) notFound();

  return (
    <main className="min-h-dvh bg-[#f5f4f6] text-gray-900 antialiased">
      <div className="mx-auto w-full max-w-md">
        <GuestApp
          code={event.code}
          eventName={event.name}
          creditsPerGuest={event.creditsPerGuest}
          initialWindowState={eventWindowState(event)}
        />
      </div>
    </main>
  );
}
