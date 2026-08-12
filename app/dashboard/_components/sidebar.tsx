"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MonitorPlay,
  PanelLeft,
  Plus,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import { Wordmark } from "@/app/_components/wordmark";
import { signOutEverywhere } from "@/app/(onboarding)/_lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EventStatus, UserDoc } from "@/lib/schema";

/**
 * Panelin sol kolonu.
 *
 * İkonlar: tasarımda her satırda aynı jenerik kare-ızgara ikonu var, bu
 * Figma'da yer tutucu gibi duruyordu. Anlamlı lucide ikonları koydum —
 * yanlışsa tek dizide değişiyor.
 */
const mainNav = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/dashboard/gorevler", label: "Görevler", icon: ListChecks },
  { href: "/dashboard/canli-akis", label: "Canlı Akış", icon: Radio },
  { href: "/dashboard/sahne", label: "Sahne / Önizleme", icon: MonitorPlay },
  { href: "/dashboard/galeri", label: "Galeri", icon: Images },
];

const adminNav = [
  { href: "/dashboard/ekip", label: "Ekip", icon: Users },
  { href: "/dashboard/ayarlar", label: "Ayarlar & Faturalandırma", icon: Settings },
];

function NavList({
  items,
  pathname,
}: {
  items: typeof mainNav;
  pathname: string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        // "/dashboard" her alt sayfada eşleşmesin diye tam eşitlik
        const active =
          href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-foreground/75 hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** İsimden baş harfler — profil fotoğrafı henüz yok. */
function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const roleLabels: Record<UserDoc["role"], string> = {
  admin: "Yönetici",
  organizer: "Organizatör",
};

/**
 * Kabuğun gösterdiği etkinlik özeti. Ham Firestore dokümanı değil: tarih
 * biçimlendirmesi sunucuda yapılıyor, buraya hazır string geliyor
 * (bu bir client component, Intl'i buraya taşımayalım).
 */
export type SidebarEvent = {
  id: string;
  name: string;
  typeLabel: string;
  dateLabel: string;
  setupProgress: number;
  status: EventStatus;
};

export function DashboardSidebar({
  user,
  event,
}: {
  user: UserDoc;
  event: SidebarEvent | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOutEverywhere();
    // replace: geri tuşuyla panele dönülmesin
    router.replace("/giris");
  }

  return (
    <aside className="sticky top-0 flex h-dvh w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Link href="/" aria-label="MIXOinteractive ana sayfa">
          <Wordmark size="sm" />
        </Link>
        {/* Sidebar daraltma tasarımda var ama davranışı tanımlı değil */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          aria-label="Menüyü daralt"
          disabled
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      {/* Etkinlik seçici + kurulum ilerlemesi */}
      <div className="px-4">
        {event ? (
          <>
            {/* Seçici davranışı henüz yok: kullanıcının tek etkinliği var.
                Çoklu etkinlik turu gelince buraya dropdown gelecek. */}
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left"
              aria-label="Etkinlik değiştir"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {event.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {event.typeLabel} • {event.dateLabel}
                </span>
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </button>

            <div className="mt-3">
              <Progress value={event.setupProgress} className="h-1" />
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Kurulum İlerlemesi
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {event.setupProgress}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <Link
            href="/dashboard?kurulum=1"
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            Etkinlik oluştur
          </Link>
        )}
      </div>

      <nav className="mt-7 flex-1 overflow-y-auto px-4" aria-label="Panel menüsü">
        <p className="px-3 pb-2 text-[11px] text-muted-foreground">Ana Menü</p>
        <NavList items={mainNav} pathname={pathname} />
      </nav>

      <div className="px-4 pb-4">
        <p className="px-3 pb-2 text-[11px] text-muted-foreground">Yönetim</p>
        <NavList items={adminNav} pathname={pathname} />

        <div className="mt-4 border-t border-sidebar-border pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                aria-label="Hesap menüsü"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent text-[11px] font-medium text-accent-foreground">
                    {initials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium">
                    {user.displayName}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {roleLabels[user.role]}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-[12.5px] font-medium">
                  {user.displayName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void handleSignOut()}>
                <LogOut className="size-3.5" aria-hidden="true" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
