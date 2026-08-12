import Link from "next/link";
import { CalendarPlus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Boş durum kutusu.
 *
 * Tasarımda sadece "Henüz Kimse Davet Edilmedi" hâli vardı; diğer sayfaların
 * boş durumları çizilmemiş. Buradaki düzen o karttan türetildi ki sayfalar
 * arasında aynı dili konuşsun.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="gap-0 px-6 py-14">
      <div className="mx-auto flex max-w-[360px] flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[14px] font-semibold">{title}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </p>
        {action ? (
          <Button asChild className="mt-5">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * Kullanıcının hiç etkinliği olmadığında panelin bütün sayfalarının bastığı
 * durum. Panelin her sayfası etkinlik bağlamına dayanıyor, bu yüzden ortak.
 */
export function NoEventState({ what }: { what: string }) {
  return (
    <EmptyState
      icon={CalendarPlus}
      title="Henüz etkinliğiniz yok"
      description={`${what} görebilmek için önce bir etkinlik oluşturmanız gerekiyor.`}
      /**
       * Panel içinde kalıyor: landing'in cümle sihirbazına ATMIYOR.
       * Etkinlik oluşturmanın tek yolu Kurulum Sihirbazı.
       */
      action={{ label: "Etkinlik Oluştur", href: "/dashboard?kurulum=1" }}
    />
  );
}
