import type { ReactNode } from "react";

/**
 * Kurulum / giriş akışının layout'u.
 *
 * Kasten çıplak: pazarlama nav'ı ve footer'ı buraya sızmıyor. Bu ekranlarda
 * kullanıcının tek bir işi var, dolayısıyla kaçış yolu da tek — sol üstteki
 * logo (OnboardingShell içinde).
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
