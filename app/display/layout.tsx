import type { ReactNode } from "react";

/**
 * Ekran kabuğu — hiçbir site kromu yok.
 *
 * Pazarlama sitesinin header/footer'ı, panelin sidebar'ı buraya girmiyor:
 * 1920x1080 sabit, scroll yok, saatlerce tek başına dönecek bir yüzey.
 * Zemin rengi sahnenin zeminiyle aynı (#130B12) — yükleme anında beyaz
 * bir çakma olmasın.
 */
export default function DisplayLayout({ children }: { children: ReactNode }) {
  return <div className="display-shell">{children}</div>;
}
