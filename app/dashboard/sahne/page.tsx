import { NoEventState } from "../_components/empty-state";
import { PageHeader } from "../_components/ui-bits";
import { getDashboardContext } from "../_lib/context";
import { StageClient } from "./_components/stage-client";

/**
 * Sunucu sarmalayıcı: oturum ve etkinlik kontrolü burada, şablon seçimi
 * istemcide (StageClient). Sayfanın kendisi client component olamıyor çünkü
 * Firestore'a Admin SDK ile sunucudan okuyoruz.
 */
export default async function StagePage() {
  const { event } = await getDashboardContext();

  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sahne / Önizleme"
          description="Büyük ekrana yansıyacak canlı mozaiğin önizlemesi"
        />
        <NoEventState what="Sahne önizlemesini" />
      </div>
    );
  }

  return <StageClient event={event} />;
}
