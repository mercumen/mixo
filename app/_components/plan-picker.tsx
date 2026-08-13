"use client";

import { Check } from "lucide-react";
import { plans, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Paket seçimi — landing akışı ve Kurulum Sihirbazı'nın 1. adımı aynı
 * componenti kullanıyor. İki yerde iki ayrı kart seti tutmak, fiyat
 * değiştiğinde birinin sessizce eski kalması demekti.
 *
 * `tone` iki yüzeyin farkını kapatıyor: landing koyu, panel açık tema.
 * Renkler `tone`'a göre seçiliyor çünkü token'lar iki tarafta farklı
 * (koyu tarafta `--color-*`, panelde shadcn `--primary` vb.).
 */
export function PlanPicker({
  value,
  onSelect,
  tone,
  disabled,
}: {
  value: PlanId | null;
  onSelect: (id: PlanId) => void;
  tone: "dark" | "light";
  disabled?: boolean;
}) {
  const dark = tone === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Paket"
      className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start"
    >
      {plans.map((plan) => {
        const selected = value === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(plan.id)}
            className={cn(
              "relative flex flex-col rounded-2xl border p-5 text-left transition-colors",
              dark
                ? selected
                  ? "border-violet bg-tint-violet"
                  : "border-line bg-white/4 hover:border-line-strong"
                : selected
                  ? "border-primary bg-card ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40",
              plan.popular && "lg:-mt-3",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            {plan.popular ? (
              <span
                className={cn(
                  "absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10.5px] font-medium whitespace-nowrap",
                  dark
                    ? "bg-violet text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                En Çok Tercih Edilen
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold tracking-tight">
                {plan.name}
              </h3>
              {selected ? (
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full",
                    dark ? "bg-violet" : "bg-primary",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3",
                      dark ? "text-white" : "text-primary-foreground",
                    )}
                    aria-hidden="true"
                  />
                </span>
              ) : null}
            </div>

            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[20px] leading-none font-semibold tracking-tight">
                {plan.priceLabel}
              </span>
              {plan.priceSuffix ? (
                <span
                  className={cn(
                    "text-[11.5px]",
                    dark ? "text-fg-muted" : "text-muted-foreground",
                  )}
                >
                  {plan.priceSuffix}
                </span>
              ) : null}
            </p>

            <p
              className={cn(
                "mt-3 text-[11.5px] leading-relaxed",
                dark ? "text-fg-muted" : "text-muted-foreground",
              )}
            >
              {plan.description}
            </p>

            <p
              className={cn(
                "mt-4 text-[11px]",
                dark ? "text-fg-subtle" : "text-muted-foreground/80",
              )}
            >
              {plan.featuresLead}
            </p>
            <ul className="mt-2.5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px]">
                  <Check
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      dark ? "text-violet" : "text-primary",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>

            {plan.contactOnly ? (
              <p
                className={cn(
                  "mt-4 text-[11px]",
                  dark ? "text-fg-subtle" : "text-muted-foreground",
                )}
              >
                Fiyat görüşmeye bağlı — seçtiğinizde satış ekibi sizinle
                iletişime geçer.
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
