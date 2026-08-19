import { getDashboardContext } from "../_lib/context";
import { paymentGate } from "../_lib/gate";
import { StageClient } from "./_components/stage-client";

/**
 * Sunucu sarmalayıcı: oturum ve etkinlik kontrolü burada, şablon seçimi
 * istemcide (StageClient). Sayfanın kendisi client component olamıyor çünkü
 * Firestore'a Admin SDK ile sunucudan okuyoruz.
 */
export default async function StagePage() {
  const { event } = await getDashboardContext();

  // ÖDEME KAPISI — bkz. _lib/gate.tsx
  const kapi = paymentGate(event, {
    title: 'Sahne / Önizleme',
    description: 'Büyük ekranda ne göründüğünü buradan seçin.',
    ne: 'Sahneyi',
  });
  if (kapi) return kapi;

  // kapi null döndü => event dolu
  return <StageClient event={event!} />;
}
