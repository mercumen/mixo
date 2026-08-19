import { findPlan } from "@/lib/plans";
import type { EventDoc } from "@/lib/schema";
import { PaymentGate } from "../_components/payment-gate";
import { NoEventState } from "../_components/empty-state";
import { PageHeader } from "../_components/ui-bits";

/**
 * Ödeme kapısının sayfa tarafı.
 *
 * Kilitli sayfalar (Görevler, Canlı Akış, Sahne, Galeri, Ekip) içeriği
 * basmadan önce bunu çağırıyor. Dönen değer null değilse sayfa onu basıp
 * duruyor.
 *
 * NEDEN SAYFA BAŞINA: tek bir üst katmanda (layout) kesmek daha kısa olurdu
 * ama Genel Bakış, Ayarlar ve Organizasyonlarım ödemeden ÖNCE de açık olmak
 * zorunda — kapının içinde olan ve olmayan sayfalar aynı layout'u paylaşıyor.
 */
export function paymentGate(
  event: EventDoc | null,
  { title, description, ne }: { title: string; description: string; ne: string },
) {
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} description={description} />
        <NoEventState what={ne} />
      </div>
    );
  }

  if (event.paid) return null;

  const plan = findPlan(event.planId);
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <PaymentGate
        eventId={event.id}
        eventName={event.name}
        planName={plan?.name ?? null}
        planPrice={plan?.priceLabel ?? null}
        ne={ne}
      />
    </div>
  );
}
