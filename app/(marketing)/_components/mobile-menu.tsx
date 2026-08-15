"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthNavButton } from "./auth-nav-button";
import { CloseIcon, MenuIcon } from "./icons";

/**
 * lg altındaki nav menüsü. Orta linkler + kimlik düğmesi 360px'lik satıra
 * sığmıyor; tasarımda mobil hâli olmadığı için linkleri gizlemek yerine bu
 * panele taşıyoruz. Landing'in statik kalması için istemciye inen tek nav
 * parçası bu dosya — nav'ın kalanı sunucuda.
 *
 * Panel `absolute` ve en yakın konumlu ata header (`relative`): kenar
 * boşlukları Container'ın px'iyle (5/8) aynı, içerik hizasında açılıyor.
 */
export function MobileMenu({
  links,
}: {
  links: readonly { label: string; href: string; active: boolean }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobil-menu"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setOpen((current) => !current)}
        // ui.tsx'teki `dark` varyantının stili; kare ikon düğmesi sette yok
        className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface-3 text-fg transition-colors duration-200 hover:border-line-strong hover:bg-surface-3/70"
      >
        {open ? (
          <CloseIcon className="size-4" />
        ) : (
          <MenuIcon className="size-4" />
        )}
      </button>

      {open ? (
        <nav
          id="mobil-menu"
          aria-label="Ana menü"
          className="absolute inset-x-5 top-full mt-3 rounded-card border border-line bg-surface-2 p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] sm:inset-x-8"
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ label, href, active }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
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

          {/* Masaüstünde nav'ın sağında duran kimlik düğmesi; mobilde burada */}
          <div className="mt-2 border-t border-line pt-3">
            <AuthNavButton />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
