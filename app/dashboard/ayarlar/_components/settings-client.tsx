"use client";

import { Check, Info, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { eventTypes } from "@/app/(onboarding)/_lib/event-setup";
import { InfoNote, PageHeader } from "../../_components/ui-bits";
import { plans } from "../../_lib/mock";

/**
 * Ayarlar formu. Değerler etkinlik dokümanından geliyor; konum ve misafir
 * sayısı alanları henüz veri modelinde yok, etkinlik yaratma turunda eklenecek.
 */
export type SettingsValues = {
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedGuests: string;
  location: string;
};

export function SettingsClient({ values }: { values: SettingsValues }) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Ayarlar & Faturalandırma"
        description="Etkinlik bilgilerini, planınızı ve fatura geçmişinizi yönetin"
      />

      <Tabs defaultValue="bilgiler">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
          <SettingsTab value="bilgiler">Etkinlik Bilgileri</SettingsTab>
          <SettingsTab value="plan">Plan & Faturalandırma</SettingsTab>
        </TabsList>

        <TabsContent value="bilgiler" className="mt-6">
          <EventInfoTab values={values} />
        </TabsContent>
        <TabsContent value="plan" className="mt-6">
          <PlansTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Alt çizgili sekme — shadcn'in varsayılan "pill" görünümü tasarıma uymuyor. */
function SettingsTab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      // flex-none şart: shadcn'in TabsTrigger'ı flex-1 taşıyor ve sekmeleri
      // tüm genişliğe yayıyor; tasarımda sola yaslı ve içerik genişliğinde.
      className="relative flex-none rounded-none border-0 bg-transparent px-0 pb-3 text-[13px] text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary"
    >
      {children}
    </TabsTrigger>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[11.5px] font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] text-muted-foreground/80">{children}</p>
  );
}

function EventInfoTab({ values }: { values: SettingsValues }) {
  return (
    <Card className="gap-0 p-5">
      <div>
        <h2 className="text-[13.5px] font-semibold tracking-tight">Genel Ayarlar</h2>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <section className="space-y-3">
          <GroupLabel>Temel Bilgiler</GroupLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Etkinlik Adı" htmlFor="s-name">
              <Input id="s-name" defaultValue={values.name} />
            </Field>
            <Field label="Etkinlik Türü" htmlFor="s-type">
              <Select defaultValue={values.type}>
                <SelectTrigger id="s-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Türler kurulum akışıyla ortak — iki yerde ayrı liste tutulmuyor */}
                  {eventTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <GroupLabel>Tarih &amp; Saat</GroupLabel>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tarih" htmlFor="s-date">
              <Input id="s-date" type="date" defaultValue={values.date} />
            </Field>
            <Field label="Başlangıç Saati" htmlFor="s-start">
              <Input id="s-start" type="time" defaultValue={values.startTime} />
            </Field>
            <Field label="Bitiş Saati" htmlFor="s-end">
              <Input id="s-end" type="time" defaultValue={values.endTime} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <GroupLabel>Kapasite &amp; Konum</GroupLabel>
          <Field label="Beklenen Misafir Sayısı" htmlFor="s-guests">
            <Input
              id="s-guests"
              type="number"
              inputMode="numeric"
              defaultValue={values.expectedGuests}
            />
          </Field>
          <InfoNote icon={<Info className="size-3.5" />}>
            Görev sayısı ve mozaik yoğunluğu önerisi bu sayıya göre hesaplanır.
          </InfoNote>

          <Field label="Lokasyon Adı" htmlFor="s-location">
            <div className="relative">
              <Input
                id="s-location"
                defaultValue={values.location}
                className="pr-9"
              />
              <MapPin
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </Field>

          {/* Harita görseli yer tutucu */}
          <div
            role="img"
            aria-label="Konum haritası yer tutucu"
            className="h-[220px] w-full rounded-lg border border-dashed border-border bg-muted"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 12px)",
            }}
          />
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5">
        <Button variant="outline" size="sm">
          Vazgeç
        </Button>
        <Button size="sm">Değişiklikleri Kaydet</Button>
      </div>
    </Card>
  );
}

function PlansTab() {
  return (
    <div>
      <div>
        <h2 className="text-[13.5px] font-semibold tracking-tight">Planlar</h2>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative gap-0 p-5",
              plan.popular && "border-primary ring-1 ring-primary lg:-mt-3",
            )}
          >
            {plan.popular ? (
              // z-10: kartın ring'i rozetin üstüne biniyordu
              <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10.5px] font-medium whitespace-nowrap text-primary-foreground">
                En Çok Tercih Edilen
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13.5px] font-semibold tracking-tight">
                {plan.name}
              </h3>
              {plan.current ? (
                <Badge
                  variant="secondary"
                  className="bg-accent text-[10.5px] text-accent-foreground"
                >
                  Mevcut
                </Badge>
              ) : null}
            </div>

            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[21px] leading-none font-semibold tracking-tight">
                {plan.priceLabel}
              </span>
              {plan.priceSuffix ? (
                <span className="text-[11.5px] text-muted-foreground">
                  {plan.priceSuffix}
                </span>
              ) : null}
            </p>

            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              {plan.description}
            </p>

            <p className="mt-5 text-[11px] text-muted-foreground/80">
              {plan.featuresLead}
            </p>
            <ul className="mt-2.5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-6 w-full"
              variant={plan.actionVariant === "ghost" ? "secondary" : plan.actionVariant}
              disabled={plan.current}
            >
              {plan.action}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
