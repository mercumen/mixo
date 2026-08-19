import { Clock, Download, Heart, Link2, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getDashboardContext } from "../_lib/context";
import { paymentGate } from "../_lib/gate";
import { listEventPhotos, type DashboardPhoto } from "../_lib/data";
import { formatLongDate } from "../_lib/format";
import { InfoNote, PageHeader, StatTile } from "../_components/ui-bits";

/**
 * Galeri — onaylı fotoğraf arşivi.
 *
 * Arama ve sıralama URL parametresiyle çalışıyor, istemci state'i yok:
 * sayfa server component kalıyor ve sonuç paylaşılabilir bir adres oluyor.
 *
 * `next/image` kullanılmıyor — gerekçe canli-akis/page.tsx'te.
 */

/** KVKK saklama süresi (CLAUDE.md): etkinlik sonrası 30 gün. */
const RETENTION_DAYS = 30;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sirala?: string }>;
}) {
  const { event } = await getDashboardContext();

  /**
   * ÖDEME KAPISI: etkinlik yoksa boş durum, ödenmemişse ödeme ekranı.
   * İkisini de `paymentGate` döndürüyor; null dönerse sayfa açık.
   */
  const kapi = paymentGate(event, {
    title: 'Galeri',
    description: 'Etkinliğin onaylı tüm fotoğraf arşivi',
    ne: 'Galeriyi',
  });
  if (kapi) return kapi;

  const { q = "", sirala = "yeni" } = await searchParams;
  // kapi null döndü => event dolu
  const photos = await listEventPhotos(event!.id);
  const approved = photos.filter((p) => p.status === "approved");

  const query = q.trim().toLocaleLowerCase("tr");
  const filtered = query
    ? approved.filter(
        (p) =>
          p.task.toLocaleLowerCase("tr").includes(query) ||
          p.guest.toLocaleLowerCase("tr").includes(query),
      )
    : approved;

  // listEventPhotos zaten en yeniden eskiye sıralı geliyor
  const visible =
    sirala === "begeni"
      ? [...filtered].sort((a, b) => b.likes - a.likes)
      : filtered;

  const totalLikes = approved.reduce((sum, p) => sum + p.likes, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Galeri"
        description="Etkinliğin onaylı tüm fotoğraf arşivi"
        actions={
          <>
            {/* Herkese açık galeri ve toplu indirme henüz yok */}
            <Button variant="outline" size="sm" disabled title="Yakında">
              <Link2 className="size-3.5" aria-hidden="true" />
              Galeri Bağlantısını Kopyala
            </Button>
            <Button size="sm" disabled title="Yakında">
              <Download className="size-3.5" aria-hidden="true" />
              Tümünü İndir (.zip)
            </Button>
          </>
        }
      />

      {/* KVKK: saklama süresi ve silme penceresi kullanıcıya görünür olmalı */}
      <InfoNote icon={<Clock className="size-3.5" />}>
        {retentionNote(event!.endsAt ?? event!.startsAt)}
      </InfoNote>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam Fotoğraf" value={approved.length} />
        <StatTile label="Toplam Beğeni" value={totalLikes} />
        <StatTile
          label="En Çok Kullanılan Görev"
          value={
            <span className="line-clamp-2 text-[13px] leading-snug font-semibold">
              {topTask(approved)}
            </span>
          }
        />
        <div className="rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11.5px] text-muted-foreground">
              Herkese Açık Galeri
            </p>
            <Switch disabled aria-label="Herkese açık galeriyi aç/kapat" />
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-muted-foreground">
            Yakında
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* GET formu: arama sunucuda yapılıyor, sonuç adrese yazılıyor */}
        <form className="relative w-full max-w-[280px]">
          {sirala !== "yeni" && (
            <input type="hidden" name="sirala" value={sirala} />
          )}
          <Search
            className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Görev veya kişi ara..."
            aria-label="Galeride ara"
            className="h-9 pl-8.5 text-[12.5px]"
          />
        </form>
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <span className="text-muted-foreground">Sırala:</span>
          <SortLink current={sirala} value="yeni" q={q}>
            En Yeni
          </SortLink>
          <SortLink current={sirala} value="begeni" q={q}>
            En Çok Beğenilen
          </SortLink>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[12.5px] text-muted-foreground">
          {approved.length === 0
            ? "Henüz onaylanmış fotoğraf yok. Onayladıkça burada birikecek."
            : "Aramanla eşleşen fotoğraf yok."}
        </p>
      ) : (
        <div className="columns-2 gap-4 lg:columns-3 xl:columns-4 [&>*]:mb-4">
          {visible.map((photo) => (
            <Card
              key={photo.id}
              className="group relative break-inside-avoid gap-0 overflow-hidden p-0"
            >
              {/* Eylemler odakla da görünür — sadece hover değil */}
              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-7 bg-card/85 backdrop-blur"
                  aria-label={`Öne çıkar: ${photo.task}`}
                  disabled
                  title="Yakında"
                >
                  <Star className="size-3.5" />
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="icon"
                  className="size-7 bg-card/85 backdrop-blur"
                >
                  <a
                    href={photo.url}
                    download={`${photo.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`İndir: ${photo.task}`}
                  >
                    <Download className="size-3.5" />
                  </a>
                </Button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.task || `${photo.guest} tarafından yüklenen fotoğraf`}
                loading="lazy"
                className="w-full bg-muted object-cover"
              />
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
    </div>
  );
}

function SortLink({
  current,
  value,
  q,
  children,
}: {
  current: string;
  value: string;
  q: string;
  children: React.ReactNode;
}) {
  const active = current === value;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (value !== "yeni") params.set("sirala", value);
  const href = params.size ? `?${params}` : "/dashboard/galeri";

  return (
    <a
      href={href}
      // Bağlantıda aria-pressed geçersiz; seçili olanı aria-current bildiriyor
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-md bg-accent px-2.5 py-1 font-medium text-accent-foreground"
          : "rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </a>
  );
}

/** En çok fotoğraf çekilen görev — boşsa tire. */
function topTask(photos: DashboardPhoto[]): string {
  if (photos.length === 0) return "—";
  const counts = new Map<string, number>();
  for (const p of photos) {
    if (p.task) counts.set(p.task, (counts.get(p.task) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "—";
}

/** Saklama uyarısı — etkinlik bitişinden 30 gün sonrası. */
function retentionNote(endsAt: string | null): string {
  if (!endsAt) {
    return `Fotoğraflar etkinlik bitiminden ${RETENTION_DAYS} gün sonra otomatik silinir.`;
  }
  const deadline = new Date(
    new Date(endsAt).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  return `Fotoğraflar etkinlik bitiminden ${RETENTION_DAYS} gün sonra otomatik silinir. İndirme penceresi ${formatLongDate(deadline.toISOString())} tarihinde kapanır.`;
}
