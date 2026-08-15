"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsUpDown,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MonitorPlay,
  Plus,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import { Wordmark } from "@/app/_components/wordmark";
import { signOutEverywhere } from "@/app/(onboarding)/_lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { EventStatus, UserDoc } from "@/lib/schema";

/**
 * Panelin sol kolonu — shadcn Sidebar üzerine kurulu.
 *
 * Bileşenden bedavaya gelenler: ikon moduna daraltma (tasarımdaki PanelLeft
 * butonu artık çalışıyor), mobilde Sheet'e dönüşme, Cmd/Ctrl+B kısayolu,
 * durumun çerezde hatırlanması (layout `defaultOpen`'ı oradan okuyor),
 * daraltıkken menü öğelerinde tooltip.
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

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof mainNav;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ href, label, icon: Icon }) => {
            // "/dashboard" her alt sayfada eşleşmesin diye tam eşitlik
            const active =
              href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={active} tooltip={label}>
                  <Link href={href} aria-current={active ? "page" : undefined}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
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
  const { isMobile } = useSidebar();

  async function handleSignOut() {
    await signOutEverywhere();
    // replace: geri tuşuyla panele dönülmesin
    router.replace("/giris");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 pt-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/"
            aria-label="MIXOinteractive ana sayfa"
            className="group-data-[collapsible=icon]:hidden"
          >
            <Wordmark size="sm" />
          </Link>
          <SidebarTrigger className="text-muted-foreground" />
        </div>

        {/* Etkinlik seçici + kurulum ilerlemesi — ikon modunda gizli */}
        <div className="px-2 pt-2 group-data-[collapsible=icon]:hidden">
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
      </SidebarHeader>

      <SidebarContent>
        <NavGroup title="Ana Menü" items={mainNav} pathname={pathname} />
        <NavGroup title="Yönetim" items={adminNav} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Hesap menüsü"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-accent text-[11px] font-medium text-accent-foreground">
                      {initials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate text-[12.5px] font-medium">
                      {user.displayName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {roleLabels[user.role]}
                    </span>
                  </span>
                  <ChevronsUpDown
                    className="ml-auto size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "top"}
                align="start"
                className="w-56"
              >
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Kenardaki ince şerit: tıklayınca aç/kapa */}
      <SidebarRail />
    </Sidebar>
  );
}
