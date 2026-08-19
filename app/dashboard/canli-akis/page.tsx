import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getDashboardContext } from "../_lib/context";
import { paymentGate } from "../_lib/gate";
import { listEventPhotos, photoStats, type DashboardPhoto } from "../_lib/data";
import { PageHeader, SectionHeading, StatTile } from "../_components/ui-bits";
import {
  ModerationModeSwitch,
  ReviewButtons,
  RemoveFromFeedButton,
} from "./_components/photo-actions";
import { planHasAiModeration } from "@/lib/plans";

/**
 * Canlı Akış — moderasyon kuyruğu + onaylı duvar.
 *
 * Fotoğraflar R2'de private duruyor; buradaki `img` etiketleri kısa ömürlü
 * imzalı adresleri gösteriyor (sunucuda üretiliyor, bkz. listEventPhotos).
 * `next/image` KULLANILMIYOR: imzalı adresler her istekte değişen sorgu
 * dizesi taşıyor, Next'in optimizasyon önbelleği bunlarla anlamsızlaşıyor
 * ve R2 host'unu `remotePatterns`a eklemek gerekiyordu.
 */
export default async function LiveFeedPage() {
  const { event } = await getDashboardContext();

  /**
   * ÖDEME KAPISI: etkinlik yoksa boş durum, ödenmemişse ödeme ekranı.
   * İkisini de `paymentGate` döndürüyor; null dönerse sayfa açık.
   */
  const kapi = paymentGate(event, {
    title: 'Canlı Akış',
    description: 'Onaylı akış, misafirlerin telefonundaki canlı duvarla aynı fotoğraf havuzunu paylaşır.',
    ne: 'Canlı akışı',
  });
  if (kapi) return kapi;

  // kapi null döndü => event dolu
  const photos = await listEventPhotos(event!.id);
  const stats = photoStats(photos);
  const queue = photos.filter(
    (p) => p.status === "pending" || p.status === "manual_review",
  );
  const approved = photos.filter((p) => p.status === "approved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Canlı Akış"
        description="Onaylı akış, misafirlerin telefonundaki canlı duvarla aynı fotoğraf havuzunu paylaşır."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam Fotoğraf" value={stats.total} />
        <StatTile label="İnceleme Bekleyen" value={stats.pending} accent />
        <StatTile label="Onaylı" value={stats.approved} />
        <StatTile label="Reddedilen" value={stats.rejected} />
      </div>

      <div className="max-w-md">
        <ModerationModeSwitch
          eventId={event!.id}
          mode={event!.moderationMode}
          aiAllowed={planHasAiModeration(event!.planId)}
        />
      </div>

      <section>
        <SectionHeading title={`İnceleme Kuyruğu (${queue.length})`} />
        {queue.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center text-[12.5px] text-muted-foreground">
            Onay bekleyen fotoğraf yok.
          </p>
        ) : (
          /* Yatay kaydırma: kuyruk uzayınca sayfa aşağı büyümesin */
          <div className="mt-4 -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {queue.map((photo) => (
              <Card
                key={photo.id}
                className="w-[230px] shrink-0 gap-0 overflow-hidden p-0"
              >
                <PhotoImage photo={photo} className="aspect-[4/3]" />
                <div className="p-3">
                  <p className="truncate text-[12.5px] font-semibold">
                    {photo.guest}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {photo.task}
                  </p>
                  <ReviewButtons eventId={event!.id} photoId={photo.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Onaylı Akış"
          description="Ekranda ve misafirlerin telefonunda dönen kareler."
        />
        {approved.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center text-[12.5px] text-muted-foreground">
            Henüz onaylı fotoğraf yok.
          </p>
        ) : (
          /* Masonry: CSS columns — kart yükseklikleri fotoğraf oranına göre değişiyor */
          <div className="mt-4 columns-2 gap-4 lg:columns-3 xl:columns-4 [&>*]:mb-4">
            {approved.map((photo) => (
              <Card
                key={photo.id}
                className="relative break-inside-avoid gap-0 overflow-hidden p-0"
              >
                <RemoveFromFeedButton
                  eventId={event!.id}
                  photoId={photo.id}
                  task={photo.task}
                />
                <PhotoImage photo={photo} />
                <div className="p-3">
                  <p className="truncate text-[12px] font-semibold">
                    {photo.guest}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {photo.task}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-primary">
                    <Heart className="size-3 fill-current" aria-hidden="true" />
                    {photo.likes}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PhotoImage({
  photo,
  className,
}: {
  photo: DashboardPhoto;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={photo.task || `${photo.guest} tarafından yüklenen fotoğraf`}
      loading="lazy"
      className={`w-full bg-muted object-cover ${className ?? ""}`}
    />
  );
}
