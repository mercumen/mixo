import type { Metadata } from "next";
import { AuthPanel } from "../_components/auth-panel";

export const metadata: Metadata = {
  title: "Giriş Yap — MIXOinteractive",
  description: "MIXOinteractive yönetim paneline giriş yapın.",
  robots: { index: false, follow: false },
};

/**
 * Doğrudan giriş — nav'daki "Giriş Yap" buraya geliyor.
 *
 * `eventName` verilmiyor: kurulum akışından gelmediği için etkinlik bağlamı
 * yok, kopya da genel varyanta düşüyor.
 */
export default function LoginPage() {
  return <AuthPanel />;
}
