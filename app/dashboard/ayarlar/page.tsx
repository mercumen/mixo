import { NoEventState } from "../_components/empty-state";
import { PageHeader } from "../_components/ui-bits";
import { getDashboardContext } from "../_lib/context";
import { SettingsClient } from "./_components/settings-client";

/**
 * Tarih girişleri `yyyy-MM-dd`, saat girişleri `HH:mm` bekliyor.
 * Tarih henüz girilmemişse boş dönüyor — alan boş görünüyor, uydurma değer yok.
 */
function toDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toTimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Etkinlikler Türkiye'de; saatleri o saat diliminde göstermek gerekiyor
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(d);
}

export default async function SettingsPage() {
  const { event } = await getDashboardContext();

  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ayarlar & Faturalandırma"
          description="Etkinlik bilgilerini, planınızı ve fatura geçmişinizi yönetin"
        />
        <NoEventState what="Ayarları" />
      </div>
    );
  }

  return (
    <SettingsClient
      values={{
        name: event.name,
        type: event.typeId,
        date: toDateInput(event.startsAt),
        startTime: toTimeInput(event.startsAt),
        endTime: toTimeInput(event.endsAt),
        // Bu iki alan henüz EventDoc'ta yok — etkinlik yaratma turunda gelecek
        expectedGuests: "",
        location: "",
      }}
    />
  );
}
