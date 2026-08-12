import { Clock, Download, Heart, Link2, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NoEventState } from "../_components/empty-state";
import { PhotoPlaceholder } from "../_components/photo-placeholder";
import { getDashboardContext } from "../_lib/context";
import { InfoNote, PageHeader, StatTile } from "../_components/ui-bits";
import { approvedPhotos, galleryStats } from "../_lib/mock";

export default async function GalleryPage() {
  const { event } = await getDashboardContext();

  // Panelin bütün sayfaları etkinlik bağlamına dayanıyor
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={"Galeri"}
          description={"Etkinliğin onaylı tüm fotoğraf arşivi"}
        />
        <NoEventState what={"Galeriyi"} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Galeri"
        description="Etkinliğin onaylı tüm fotoğraf arşivi"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Link2 className="size-3.5" aria-hidden="true" />
              Galeri Bağlantısını Kopyala
            </Button>
            <Button size="sm">
              <Download className="size-3.5" aria-hidden="true" />
              Tümünü İndir (.zip)
            </Button>
          </>
        }
      />

      {/* KVKK: saklama süresi ve silme penceresi kullanıcıya görünür olmalı */}
      <InfoNote icon={<Clock className="size-3.5" />}>
        {galleryStats.retentionNote}
      </InfoNote>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam Fotoğraf" value={galleryStats.photos} />
        <StatTile label="Toplam Beğeni" value={galleryStats.likes} />
        <StatTile
          label="En Çok Kullanılan Görev"
          value={
            <span className="line-clamp-2 text-[13px] leading-snug font-semibold">
              {galleryStats.topTask}
            </span>
          }
        />
        <div className="rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11.5px] text-muted-foreground">Herkese Açık Galeri</p>
            <Switch
              defaultChecked={galleryStats.publicGallery}
              aria-label="Herkese açık galeriyi aç/kapat"
            />
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-primary">
            {galleryStats.publicGallery ? "Açık" : "Kapalı"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-[280px]">
          <Search
            className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Görev veya kişi ara..."
            aria-label="Galeride ara"
            className="h-9 pl-8.5 text-[12.5px]"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <span className="text-muted-foreground">Sırala:</span>
          <button
            type="button"
            aria-pressed="true"
            className="rounded-md bg-accent px-2.5 py-1 font-medium text-accent-foreground"
          >
            En Yeni
          </button>
          <button
            type="button"
            aria-pressed="false"
            className="rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground"
          >
            En Çok Beğenilen
          </button>
        </div>
      </div>

      <div className="columns-2 gap-4 lg:columns-3 xl:columns-4 [&>*]:mb-4">
        {approvedPhotos.map((photo) => (
          <Card
            key={photo.id}
            className="group relative break-inside-avoid gap-0 overflow-hidden p-0"
          >
            {/* Yıldız/indir eylemleri odakla da görünür — sadece hover değil */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="size-7 bg-card/85 backdrop-blur"
                aria-label={`Öne çıkar: ${photo.task}`}
              >
                <Star className="size-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="size-7 bg-card/85 backdrop-blur"
                aria-label={`İndir: ${photo.task}`}
              >
                <Download className="size-3.5" />
              </Button>
            </div>
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
    </div>
  );
}
