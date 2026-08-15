import Link from "next/link";
import { Wordmark } from "@/app/_components/wordmark";
import { AuthNavButton } from "./auth-nav-button";
import { MobileMenu } from "./mobile-menu";
import { ButtonLink, Container } from "./ui";

/**
 * Tasarımda 3 nav linki var ve "Nasıl Çalışır" aktif görünüyor (koyu pill).
 * Bu bölümler henüz yok — hepsi sayfa içi anchor'a bağlı.
 */
const navLinks = [
  { label: "Nasıl Çalışır", href: "#nasil-calisir", active: true },
  { label: "Paketler", href: "#paketler", active: false },
  { label: "Vizyonumuz", href: "#vizyonumuz", active: false },
] as const;

export function SiteNav() {
  return (
    <header className="relative z-20 pt-6">
      <Container className="flex items-center justify-between gap-6">
        <Link href="/" aria-label="MIXOinteractive ana sayfa">
          {/* 360px'te satır taşıyordu: dar ekranda küçük boy, sm ve üstünde
              tasarımdaki boy. Wordmark ortak component olduğu için boy seçimi
              burada, iki render'la yapılıyor — component'e dokunulmuyor. */}
          <Wordmark size="sm" className="sm:hidden" />
          <Wordmark size="md" className="hidden sm:inline" />
        </Link>

        {/* Orta menü lg altında gizli; linkler MobileMenu panelinde.
            Tasarımda mobil hâli yok — panel mevcut pill stillerini kullanıyor. */}
        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-2">
            {navLinks.map(({ label, href, active }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-surface-3 text-fg"
                      : "text-fg-muted hover:bg-white/6 hover:text-fg"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/etkinlik-olustur" variant="solid" size="sm">
            Etkinliği Yarat
          </ButtonLink>
          {/* Sadece bu düğme istemcide: girişliyken "Panelim" oluyor.
              Nav ve sayfanın kalanı sunucuda, landing statik kalıyor.
              lg altında satıra sığmadığı için MobileMenu panelinde. */}
          <div className="hidden lg:block">
            <AuthNavButton />
          </div>
          <MobileMenu links={navLinks} />
        </div>
      </Container>
    </header>
  );
}
