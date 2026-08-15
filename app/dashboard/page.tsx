import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  MapPin,
  Pencil,
  Printer,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EventDoc } from "@/lib/schema";
import { progressFromSteps, nextIncompleteStep, setupSteps, isOptionalStep } from "@/lib/setup-steps";
import { Countdown } from "./_components/countdown";
import { NoEventState } from "./_components/empty-state";
import { SetupWizard } from "./_components/setup-wizard/setup-wizard";
import { InfoNote, SectionHeading } from "./_components/ui-bits";
import { qrDataUrl } from "@/lib/qr";
import { QrDownloadModal } from "./_components/qr-download-modal";
import { getDashboardContext } from "./_lib/context";
import { listMissions } from "./_lib/data";
import {
  countdownTo,
  eventTypeLabel,
  formatLongDate,
  formatShortDateTime,
} from "./_lib/format";
import { findPlan } from "@/lib/plans";

/**
 * Sihirbaz URL'de açılıyor (`?kurulum=1`).
 *
 * Sebep: panel içindeki bütün "kuruluma git" düğmeleri sade birer Link
 * olabiliyor, durum yukarı taşınmıyor ve geri tuşu modal'ı kapatıyor.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ kurulum?: string }>;
}) {
  const { event } = await getDashboardContext();
  const { kurulum } = await searchParams;

  if (!event) {
    return (
      <div className="space-y-6">
        {/* Etkinlik yokken de sihirbaz açılıyor: 1. adım etkinliği YARATIYOR */}
        {kurulum === "1" ? <SetupWizard event={null} missionCount={0} /> : null}

        <div>
          <h1 className="text-[19px] font-semibold tracking-tight">
            Genel Bakış
          </h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            İlk etkinliğinizi oluşturduğunuzda kurulum durumu burada görünecek.
          </p>
        </div>
        <NoEventState what="Etkinlik özetini" />
      </div>
    );
  }

  const missions = await listMissions(event.id);
  // QR sunucuda üretiliyor: `qrcode` paketi istemci paketine girmiyor
  const qrImage = await qrDataUrl(event.code, 512);
  const completed = event.completedSteps ?? [];
  const progress = progressFromSteps(completed);
  const next = nextIncompleteStep(completed);

  return (
    <div className="space-y-6">
      {/* Panel içindeki kurulum: landing'in cümle sihirbazı DEĞİL, bu modal */}
      {kurulum === "1" ? (
        <SetupWizard event={event} missionCount={missions.length} />
      ) : null}

      <EventBanner event={event} />

      <div>
        <h1 className="text-[19px] font-semibold tracking-tight">Genel Bakış</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {event.status === "taslak"
            ? "Etkinliğiniz henüz taslak modunda, canlıya almadan önce kurulumu tamamlayın."
            : "Etkinliğiniz canlı. Canlı akış ve sahne sayfalarından takip edebilirsiniz."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ReadinessCard
          progress={progress}
          completed={completed}
          nextTitle={next.title}
          nextHint={next.hint}
        />
        <div className="space-y-5">
          <TeamInviteCard />
          <DemoQrCard
            code={event.code}
            qrImage={qrImage}
            eventName={event.name}
            printDeadline={printDeadlineFor(event.startsAt)}
          />
        </div>
        <div className="space-y-5">
          <CountdownCard event={event} />
          <CurrentPlanCard planId={event.planId} />
        </div>
      </div>
    </div>
  );
}

function EventBanner({ event }: { event: EventDoc }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Harita görseli yer tutucu — konum alanı henüz veri modelinde yok */}
      <div
        aria-label="Harita görseli yer tutucu"
        role="img"
        className="h-[190px] w-full bg-muted"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 12px)",
        }}
      />
      <div className="flex flex-col items-center px-6 pt-0 pb-6 text-center">
        <div className="-mt-9 grid size-[72px] place-items-center rounded-full border-4 border-card bg-accent">
          <Sparkles className="size-7 text-primary" aria-hidden="true" />
        </div>
        <h2 className="mt-3 flex items-center gap-2 text-[19px] font-semibold tracking-tight">
          {event.name}
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        </h2>
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatLongDate(event.startsAt)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {event.locationName ?? "Konum girilmedi"}
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {event.expectedGuests
              ? `${event.expectedGuests} misafir`
              : eventTypeLabel(event.typeId)}
          </li>
        </ul>
        <Link
          href="/dashboard/ayarlar"
          className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Etkinlik bilgilerini düzenle
        </Link>
      </div>
    </div>
  );
}

function ReadinessCard({
  progress,
  completed,
  nextTitle,
  nextHint,
}: {
  progress: number;
  completed: string[];
  nextTitle: string;
  nextHint: string;
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight">
            Canlıya Hazırlık
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {completed.length}/{setupSteps.length} adım tamam
          </p>
        </div>
        <ProgressRing value={progress} />
      </div>

      <ol className="mt-5 flex items-center justify-between gap-1">
        {setupSteps.map((step, i) => (
          <li key={step.id} className="flex flex-1 items-center gap-1">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-medium ${
                completed.includes(step.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.title === nextTitle
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
              }`}
              aria-label={`${i + 1}. adım: ${step.title}`}
            >
              {i + 1}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </li>
        ))}
        <li>
          <span
            className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground"
            aria-label="Canlıya alma"
          >
            <Zap className="size-3.5" aria-hidden="true" />
          </span>
        </li>
      </ol>

      <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-accent/50 p-4">
        <p className="text-[11px] font-medium text-primary">Sıradaki Adım</p>
        <p className="mt-1.5 text-[13px] font-semibold">{nextTitle}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          {nextHint}
        </p>
        <Button asChild size="sm" className="mt-3 h-8 text-[12px]">
          <Link href="/dashboard?kurulum=1">Adımı Tamamla</Link>
        </Button>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {setupSteps.map((step) => (
          <li key={step.id} className="flex items-center gap-2.5 py-2.5">
            {completed.includes(step.id) ? (
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-primary">
                <Check
                  className="size-2.5 text-primary-foreground"
                  aria-hidden="true"
                />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-border"
              />
            )}
            <span className="min-w-0 flex-1 truncate text-[12.5px]">
              {step.title}
            </span>
            {isOptionalStep(step.id) ? (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                (isteğe bağlı)
              </span>
            ) : null}
            <span className="shrink-0 text-muted-foreground">
              {completed.includes(step.id) ? (
                <Pencil className="size-3.5" aria-hidden="true" />
              ) : (
                <span aria-hidden="true" className="text-[13px]">
                  →
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-4 w-full">
        <Link href="/dashboard?kurulum=1">Sihirbaza Git Kurulumu Tamamla →</Link>
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Tahmini kalan tamamlama süresi: 2 dakika
      </p>
    </Card>
  );
}

/** SVG halka — shadcn Progress yatay, tasarımda dairesel. */
function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[54px] shrink-0">
      <svg
        viewBox="0 0 54 54"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="27"
          cy="27"
          r={r}
          fill="none"
          strokeWidth="5"
          className="stroke-border"
        />
        <circle
          cx="27"
          cy="27"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[12px] font-semibold">
        {value}%
      </span>
    </div>
  );
}

function TeamInviteCard() {
  return (
    <Card className="gap-0 p-5">
      <SectionHeading
        title="Takım ve Moderatör Daveti"
        description="Canlıya almadan önce son adımlar"
      />
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="grid size-11 place-items-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-3 text-[13px] font-semibold">
          Henüz Kimse Davet Edilmedi
        </p>
        <p className="mt-1 max-w-[260px] text-[11.5px] leading-relaxed text-muted-foreground">
          Ekip arkadaşlarınızı ve moderatörlerinizi davet ederek onay sürecini
          paylaşın
        </p>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href="/dashboard/ekip">
            <UserPlus className="size-4" aria-hidden="true" />
            Ekip Arkadaşı / Moderatör Ekle
          </Link>
        </Button>
      </div>
    </Card>
  );
}

/**
 * Baskı için son tarih — etkinlikten 1 hafta önce.
 * Matbaa provası ve renk kontrolü için pay bırakıyoruz (tasarımdaki uyarı).
 */
function printDeadlineFor(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - 7);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(d);
}

function DemoQrCard({
  code,
  qrImage,
  eventName,
  printDeadline,
}: {
  code: string;
  qrImage: string;
  eventName: string;
  printDeadline: string | null;
}) {
  return (
    <Card className="gap-0 p-5">
      <SectionHeading
        title="Demo Qr Kodu"
        description="Canlıya almadan önce son adımlar"
      />
      <div className="mt-5 flex flex-col items-center">
        {/* Gerçek QR — sunucuda üretiliyor, misafir adresini taşıyor */}
        <div className="rounded-lg border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img
            src={qrImage}
            alt={`${eventName} etkinliği için QR kodu`}
            className="size-[116px]"
          />
        </div>
        <p className="mt-3 font-mono text-[13px] font-semibold tracking-widest">
          {code}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Test için misafir akışını görüntüle
        </p>
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="text-[12px]">
            <Link href={`/e/${code}`} target="_blank">
              Kodu Büyüt
            </Link>
          </Button>
          <QrDownloadModal
            eventName={eventName}
            code={code}
            qrDataUrl={qrImage}
            printDeadline={printDeadline}
          />
        </div>
        {printDeadline ? (
          <InfoNote className="mt-4" icon={<Printer className="size-3.5" />}>
            Baskı alacaksanız en geç{" "}
            <strong className="font-semibold">{printDeadline}</strong> tarihinde
            matbaaya verin; provada renk ve kod okunurluğunu kontrol edin.
          </InfoNote>
        ) : null}
      </div>
    </Card>
  );
}

function CountdownCard({ event }: { event: EventDoc }) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] text-muted-foreground">Etkinliğe Kalan</p>
          <Countdown
            startsAt={event.startsAt}
            initial={countdownTo(event.startsAt)}
          />
          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatShortDateTime(event.startsAt)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <CreditCard className="size-3.5" aria-hidden="true" />
            Henüz ödeme yapılmamış
          </p>
        </div>
        <Button size="sm" className="shrink-0" disabled>
          <Zap className="size-3.5" aria-hidden="true" />
          Canlıya Al
        </Button>
      </div>
    </Card>
  );
}

function CurrentPlanCard({ planId }: { planId: string | null }) {
  const currentPlan = findPlan(planId);

  // Paket henüz seçilmemişse uydurma plan göstermiyoruz
  if (!currentPlan) {
    return (
      <Card className="gap-0 p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Mevcut Plan</p>
            <p className="text-[13.5px] font-semibold">Paket seçilmedi</p>
          </div>
        </div>
        <Button asChild size="sm" className="mt-4 w-full">
          <Link href="/dashboard?kurulum=1">Paket Seç</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Mevcut Plan</p>
          <p className="text-[14px] font-semibold tracking-tight">
            {currentPlan.name}{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              {currentPlan.priceLabel} {currentPlan.priceSuffix}
            </span>
          </p>
        </div>
      </div>

      <InfoNote className="mt-4" icon={<ShieldCheck className="size-3.5" />}>
        <p className="font-semibold text-foreground">Henüz ödeme alınmadı</p>
        <p className="mt-0.5">
          Şimdi ödeyebilir ya da canlıya alırken ödeyebilirsin. Ücret yalnızca
          bir kez alınır.
        </p>
      </InfoNote>

      <p className="mt-4 text-[11px] text-muted-foreground">
        {currentPlan.featuresLead}
      </p>
      <ul className="mt-2.5 space-y-2">
        {currentPlan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px]">
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="min-w-0">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="text-[12px]" asChild>
          <Link href="/dashboard/ayarlar">
            Planı Değiştir
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
        <Button size="sm" className="text-[12px]" disabled>
          Şimdi Öde
        </Button>
      </div>
    </Card>
  );
}
