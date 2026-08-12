import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoPlaceholder } from "../_components/photo-placeholder";
import { NoEventState } from "../_components/empty-state";
import { getDashboardContext } from "../_lib/context";
import { PageHeader, SectionHeading, StatTile } from "../_components/ui-bits";
import { approvedPhotos, feedStats, reviewQueue } from "../_lib/mock";

export default async function LiveFeedPage() {
  const { event } = await getDashboardContext();

  // Panelin bütün sayfaları etkinlik bağlamına dayanıyor
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={"Canlı Akış"}
          description={"Onaylı akış, misafirlerin telefonundaki canlı duvarla aynı fotoğraf havuzunu paylaşır."}
        />
        <NoEventState what={"Canlı akışı"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Canlı Akış"
        description="Onaylı akış, misafirlerin telefonundaki canlı duvarla aynı fotoğraf havuzunu paylaşır."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam Fotoğraf" value={feedStats.total} />
        <StatTile label="İnceleme Bekleyen" value={feedStats.pending} accent />
        <StatTile label="Onaylı" value={feedStats.approved} />
        <StatTile label="Reddedilen" value={feedStats.rejected} />
      </div>

      <section>
        <SectionHeading title={`İnceleme Kuyruğu (${reviewQueue.length})`} />
        {/* Yatay kaydırma: kuyruk uzayınca sayfa aşağı büyümesin */}
        <div className="mt-4 -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {reviewQueue.map((photo) => (
            <Card key={photo.id} className="w-[230px] shrink-0 gap-0 overflow-hidden p-0">
              <PhotoPlaceholder
                ratio={photo.ratio}
                label={photo.task}
                className="rounded-none border-0 border-b"
              />
              <div className="p-3">
                <p className="truncate text-[12.5px] font-semibold">{photo.guest}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {photo.task}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-accent text-[12px] text-accent-foreground hover:bg-accent/80"
                  >
                    Onayla
                  </Button>
                  <Button variant="outline" size="sm" className="text-[12px]">
                    Reddet
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Onaylı Akış"
          description="Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."
        />
        {/* Masonry: CSS columns — kart yükseklikleri fotoğraf oranına göre değişiyor */}
        <div className="mt-4 columns-2 gap-4 lg:columns-3 xl:columns-4 [&>*]:mb-4">
          {approvedPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="relative break-inside-avoid gap-0 overflow-hidden p-0"
            >
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 size-7 bg-card/85 text-muted-foreground backdrop-blur hover:text-destructive"
                aria-label={`Akıştan kaldır: ${photo.task}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
              <PhotoPlaceholder
                ratio={photo.ratio}
                label={photo.task}
                className="rounded-none border-0"
              />
              <div className="p-3">
                <p className="truncate text-[12px] font-semibold">{photo.guest}</p>
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
      </section>
    </div>
  );
}
