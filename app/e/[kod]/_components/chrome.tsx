"use client";

import { CircleHelp, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Misafir uygulamasının ortak parçaları — logo, polaroid dekorları,
 * CTA butonu, alt sekme çubuğu, görev ilerleme noktaları.
 *
 * Tasarım dili tamamen tasarım ekran görüntülerinden: açık zemin, kenarlarda
 * bulanık polaroidler, mor degrade hap butonlar, beyaz hap alt navigasyon.
 */

export function Logo() {
  return (
    <div className="flex select-none items-baseline justify-center gap-1">
      <span className="text-base font-extrabold tracking-[0.3em] text-gray-800">
        MIXO
      </span>
      <span className="text-[10px] font-semibold tracking-wide text-gray-500">
        interactive
      </span>
    </div>
  );
}

/**
 * Polaroid yer tutucusu.
 *
 * Fotoğraflar sonra gelecek (tasarımdaki görseller stok) — şimdilik beyaz
 * çerçeve + yumuşak degrade iç. `tone` ile iç renk çeşitleniyor ki dağınık
 * küme tekdüze durmasın.
 */
const polaroidTones = [
  "from-violet-200 via-purple-100 to-fuchsia-100",
  "from-amber-100 via-orange-50 to-rose-100",
  "from-sky-100 via-indigo-100 to-violet-100",
  "from-rose-100 via-pink-100 to-purple-100",
  "from-emerald-100 via-teal-50 to-sky-100",
] as const;

export function Polaroid({
  className,
  tone = 0,
}: {
  className?: string;
  tone?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white p-1.5 pb-4 shadow-[0_6px_20px_rgba(20,10,50,0.12)]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full w-full rounded-[4px] bg-gradient-to-br",
          polaroidTones[tone % polaroidTones.length],
        )}
      />
    </div>
  );
}

/**
 * Sayfa kenarlarındaki bulanık polaroid serpintisi.
 *
 * `pointer-events-none`: dekor hiçbir dokunuşu yutmuyor — özellikle
 * kaydırma ve buton alanlarının üstüne taşan köşelerde önemli.
 */
export function PolaroidScatter() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Polaroid className="absolute -left-8 top-24 h-28 w-24 -rotate-12 blur-[3px]" tone={2} />
      <Polaroid className="absolute -right-9 top-10 h-32 w-26 rotate-12 blur-[3px]" tone={1} />
      <Polaroid className="absolute -right-10 top-[38%] h-30 w-26 rotate-6 blur-[2px]" tone={0} />
      <Polaroid className="absolute -left-10 top-[46%] h-28 w-24 rotate-3 blur-[2px]" tone={3} />
      <Polaroid className="absolute -left-8 bottom-[18%] h-26 w-22 -rotate-12 blur-[3px]" tone={4} />
      <Polaroid className="absolute -right-8 bottom-[8%] h-28 w-24 rotate-12 blur-[3px]" tone={1} />
    </div>
  );
}

/** Karşılama ve görev açılışındaki üst üste binmiş polaroid kümesi. */
export function PhotoStack({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto h-40 w-56", className)}>
      <Polaroid className="absolute left-0 top-6 h-28 w-22 -rotate-12" tone={2} />
      <Polaroid className="absolute left-12 top-0 h-32 w-24 rotate-6" tone={1} />
      <Polaroid className="absolute right-8 top-2 h-30 w-24 rotate-12" tone={0} />
      <Polaroid className="absolute left-20 top-10 h-28 w-22 -rotate-3" tone={3} />
      <Polaroid className="absolute right-0 top-8 h-26 w-20 rotate-[18deg]" tone={4} />
    </div>
  );
}

/** Mor degrade ana buton — pasifken tasarımdaki gibi soluk mora düşüyor. */
export function CtaButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-full py-4 text-base font-semibold text-white transition",
        disabled
          ? "bg-gradient-to-r from-violet-400 to-purple-400"
          : "bg-gradient-to-r from-violet-800 via-violet-600 to-purple-500 shadow-lg shadow-violet-600/30 active:scale-[0.98]",
      )}
    >
      {children}
    </button>
  );
}

/** "ya da Akışa Göz At" tarzı ikincil satır. */
export function SecondaryAction({
  label,
  onClick,
  underline,
}: {
  label: string;
  onClick: () => void;
  underline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto block py-2 text-sm text-gray-500"
    >
      ya da{" "}
      <span
        className={cn("font-bold text-gray-800", underline && "underline")}
      >
        {label}
      </span>
    </button>
  );
}

/** Alt sekme çubuğu: Görevler / Akış. */
export function BottomNav({
  active,
  onSelect,
}: {
  active: "gorevler" | "akis";
  onSelect: (tab: "gorevler" | "akis") => void;
}) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_10px_36px_rgba(20,10,50,0.18)]">
        <NavTab
          label="Görevler"
          icon={<CircleHelp className="h-4 w-4" />}
          active={active === "gorevler"}
          onClick={() => onSelect("gorevler")}
        />
        <NavTab
          label="Akış"
          icon={<ImageIcon className="h-4 w-4" />}
          active={active === "akis"}
          onClick={() => onSelect("akis")}
        />
      </div>
    </nav>
  );
}

function NavTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition",
        active ? "bg-violet-100 text-violet-700" : "text-gray-500",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          active ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

/** Görev kartındaki ilerleme: ● — · — · (aktif büyük koyu, bitenler mor). */
export function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span
              className={cn(
                "h-px w-7",
                i <= current ? "bg-violet-300" : "bg-gray-300",
              )}
            />
          )}
          <span
            className={cn(
              "rounded-full",
              i === current
                ? "h-2.5 w-2.5 bg-gray-900"
                : i < current
                  ? "h-2 w-2 bg-violet-500"
                  : "h-1.5 w-1.5 bg-gray-300",
            )}
          />
        </div>
      ))}
    </div>
  );
}
