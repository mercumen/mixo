import { Bell, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels } from "../_lib/format";
import type { SidebarEvent } from "./sidebar";

/**
 * Üst şerit: solda hangi etkinliğe baktığın, sağda dil / tema / bildirim.
 *
 * TR-EN, tema ve bildirim düğmeleri şu an devre dışı: CLAUDE.md çoklu dili
 * kapsam dışı (v2) sayıyor, koyu panel teması ve bildirim merkezi de
 * tasarımda yok. Yerlerini tutuyorlar, davranışları tanımlanınca açılacak.
 */
export function DashboardTopbar({ event }: { event: SidebarEvent | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-6 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        {event ? (
          <>
            <span className="min-w-0 truncate text-[13px] font-semibold">
              {event.name}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium",
                event.status === "canli"
                  ? "text-emerald-600"
                  : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  event.status === "canli"
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/60",
                )}
              />
              {statusLabels[event.status]}
            </span>
          </>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            Organizatör Paneli
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div
          role="group"
          aria-label="Dil seçimi"
          className="mr-1 flex items-center rounded-md border border-border p-0.5"
        >
          <span className="rounded-[5px] bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            TR
          </span>
          <span className="px-2 py-0.5 text-[11px] text-muted-foreground">EN</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label="Temayı değiştir"
          disabled
        >
          <Sun className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label="Bildirimler"
          disabled
        >
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
