import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardSidebar } from "./_components/sidebar";
import { DashboardTopbar } from "./_components/topbar";
import { getDashboardContext } from "./_lib/context";
import { progressFromSteps } from "@/lib/setup-steps";
import { eventTypeLabel, formatLongDate } from "./_lib/format";

export const metadata: Metadata = {
  title: "Organizatör Paneli — MIXOinteractive",
  robots: { index: false, follow: false },
};

/**
 * Organizatör paneli kabuğu.
 *
 * KORUMA İKİ KATMANLI:
 *   1. `proxy.ts` — çerez hiç yoksa buraya gelmeden /giris'e atıyor (ucuz)
 *   2. Burası — çerezi Admin SDK ile GERÇEKTEN doğruluyor: süresi geçmiş,
 *      bozuk ya da iptal edilmiş çerez elenir (otoriter)
 *
 * Sadece proxy'ye güvenmek yetmez, o sadece çerezin varlığına bakıyor.
 * Sadece buraya güvenmek de yetmez: layout'lar aynı segment içindeki istemci
 * gezinmelerinde tekrar çalışmıyor. Asıl kapı yine veri endpoint'leri —
 * onlar kendi token doğrulamalarını yapıyor.
 *
 * TEMA: burası AÇIK tema. Pazarlama sitesi ve kurulum akışı koyu, `body` de
 * onlara göre koyu ayarlı — panel zeminini burada açıkça kuruyoruz.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Çerez doğrulaması: yoksa hiç veri çekmeden çıkıyoruz
  const authed = await getCurrentUser();
  if (!authed) redirect("/giris");

  const { user, event } = await getDashboardContext();

  // Kabuk ham dokümanı değil ekrana hazır alanları alıyor: biçimlendirme
  // sunucuda kalsın, sidebar client component olduğu için oraya Intl taşımayalım.
  const eventSummary = event
    ? {
        id: event.id,
        name: event.name,
        typeLabel: eventTypeLabel(event.typeId),
        dateLabel: formatLongDate(event.startsAt),
        setupProgress: progressFromSteps(event.completedSteps ?? []),
        status: event.status,
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-1 bg-background text-foreground">
      <DashboardSidebar user={user} event={eventSummary} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar event={eventSummary} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
