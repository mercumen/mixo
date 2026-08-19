import Link from "next/link";
import { CalendarDays, CreditCard, MapPin, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findPlan } from "@/lib/plans";
import { progressFromSteps } from "@/lib/setup-steps";
import { getDashboardContext } from "../_lib/context";
import { eventTypeLabel, formatLongDate, statusLabels } from "../_lib/format";
import { PageHeader } from "../_components/ui-bits";
import { ActivateEventButton } from "./_components/event-switch";

/**
 * ORGANİZASYONLARIM — kullanıcının tüm etkinlikleri.
 *
 * Bu sayfa bir eksiği kapatıyor: panel her zaman "en yeni etkinliği"
 * gösteriyordu, diğerlerine ulaşmanın yolu yoktu. Veri tarafında birden fazla
 * etkinlik hep mümkündü; görünmüyorlardı.
 *
 * Ödeme kapısının DIŞINDA: ödenmemiş etkinlik de burada listeleniyor, çünkü
 * ödeme düğmesine ulaşmanın yolu bu sayfa ve Genel Bakış.
 */
export default async function OrganizationsPage() {
  const { event: active, events } = await getDashboardContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizasyonlarım"
        description="Tüm etkinlikleriniz. Açmak istediğinizi seçin ya da yenisini oluşturun."
        actions={
          <Button size="sm" asChild>
            <Link href="/etkinlik-olustur">
              <Plus className="size-3.5" aria-hidden="true" />
              Yeni Etkinlik
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <Card className="gap-0 p-10 text-center">
          <p className="text-[13.5px] font-semibold">Henüz etkinliğiniz yok</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            İlk etkinliğinizi oluşturduğunuzda burada listelenecek.
          </p>
          <div className="mt-5 flex justify-center">
            <Button size="sm" asChild>
              <Link href="/etkinlik-olustur">Etkinlik Oluştur</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => {
            const plan = findPlan(e.planId);
            const setup = progressFromSteps(e.completedSteps ?? []);
            const aktif = e.id === active?.id;

            return (
              <Card
                key={e.id}
                className={`gap-0 p-5 ${aktif ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14px] font-semibold tracking-tight">
                      {e.name}
                    </h2>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {eventTypeLabel(e.typeId)} • Kod: {e.code}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      e.paid
                        ? "bg-accent text-[11px] text-accent-foreground"
                        : "bg-muted text-[11px] text-muted-foreground"
                    }
                  >
                    {e.paid ? "Ödendi" : "Ödeme bekliyor"}
                  </Badge>
                </div>

                <dl className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                    <dd>{formatLongDate(e.startsAt)}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 shrink-0" aria-hidden="true" />
                    <dd>
                      {e.expectedGuests
                        ? `${e.expectedGuests} kişi bekleniyor`
                        : e.guestRange || "Katılımcı sayısı girilmedi"}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <dd>{e.locationName || "Mekan girilmedi"}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-3.5 shrink-0" aria-hidden="true" />
                    <dd>{plan ? plan.name : "Paket seçilmedi"}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <Progress value={setup} className="h-1" />
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Kurulum • {statusLabels[e.status]}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {setup}%
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <ActivateEventButton eventId={e.id} aktif={aktif} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
