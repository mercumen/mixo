"use client";

import { Info, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventTypes } from "@/app/(onboarding)/_lib/event-setup";
import { InfoNote } from "../ui-bits";

/**
 * Adım 1 — Etkinlik Bilgileri.
 *
 * ÖNEMLİ: Ad ve tür ÖNCEDEN DOLU geliyor. Kullanıcı bunları landing'deki
 * cümle sihirbazında zaten seçti; tekrar sormak akışı kırıyordu.
 * Boş gelen alanlar tarih, saat, misafir sayısı ve konum.
 */

export type EventInfoValues = {
  name: string;
  typeId: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedGuests: string;
  locationName: string;
};

export function StepEventInfo({
  values,
  onChange,
}: {
  values: EventInfoValues;
  onChange: (patch: Partial<EventInfoValues>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-[11.5px] text-muted-foreground/80">Temel Bilgiler</p>

        <div className="space-y-1.5">
          <Label htmlFor="w-name" className="text-[11.5px] font-normal">
            Etkinlik Adı
          </Label>
          <Input
            id="w-name"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="w-type" className="text-[11.5px] font-normal">
            Etkinlik Türü
          </Label>
          <Select
            value={values.typeId}
            onValueChange={(typeId) => onChange({ typeId })}
          >
            <SelectTrigger id="w-type" className="w-full">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11.5px] text-muted-foreground/80">Tarih &amp; Saat</p>

        <div className="space-y-1.5">
          <Label htmlFor="w-date" className="text-[11.5px] font-normal">
            Tarih
          </Label>
          <Input
            id="w-date"
            type="date"
            value={values.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="w-start" className="text-[11.5px] font-normal">
              Başlangıç Saati
            </Label>
            <Input
              id="w-start"
              type="time"
              value={values.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-end" className="text-[11.5px] font-normal">
              Bitiş Saati
            </Label>
            <Input
              id="w-end"
              type="time"
              value={values.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11.5px] text-muted-foreground/80">
          Kapasite &amp; Konum
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="w-guests" className="text-[11.5px] font-normal">
            Beklenen Misafir Sayısı
          </Label>
          <Input
            id="w-guests"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.expectedGuests}
            onChange={(e) => onChange({ expectedGuests: e.target.value })}
          />
        </div>

        <InfoNote icon={<Info className="size-3.5" />}>
          Görev sayısı ve mozaik yoğunluğu önerisi bu sayıya göre hesaplanır.
        </InfoNote>

        <div className="space-y-1.5">
          <Label htmlFor="w-location" className="text-[11.5px] font-normal">
            Lokasyon Adı
          </Label>
          <div className="relative">
            <Input
              id="w-location"
              value={values.locationName}
              onChange={(e) => onChange({ locationName: e.target.value })}
              placeholder="Örn. İzmir, Bahar Event Hall"
              className="pr-9"
            />
            <MapPin
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
