import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Baskı — MIXOinteractive",
  robots: { index: false, follow: false },
};

/**
 * Baskı layout'u — kasten çıplak.
 *
 * Panel kabuğunun (sidebar, topbar) dışında: yazdırma çıktısına menü
 * girmesin. Zemin de beyaz — `body` koyu ayarlı, baskıda mürekkep yakardı.
 */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 bg-white text-neutral-900">{children}</div>
  );
}
