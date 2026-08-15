import type { Metadata } from "next";
import { Wordmark } from "@/app/_components/wordmark";
import { GateForm } from "./gate-form";

/**
 * Site kilidi ekranı (geçici, lansmana kadar — bkz. lib/gate.ts).
 *
 * Kasten ketum: ne olduğunu anlatmıyor, sadece parola soruyor. Proje gizli;
 * bu sayfa dışarıya sızan tek yüzey ve bir şey ele vermemeli.
 */

export const metadata: Metadata = {
  title: "MIXOinteractive",
  robots: { index: false, follow: false },
};

export default function GatePage() {
  return (
    <main className="glow-onboarding flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="w-full max-w-[340px]">
        <div className="flex justify-center">
          <Wordmark size="sm" />
        </div>
        <p className="mt-6 text-center text-sm text-white/60">
          Bu alan şu an özel erişime kapalı.
        </p>
        <GateForm />
      </div>
    </main>
  );
}
