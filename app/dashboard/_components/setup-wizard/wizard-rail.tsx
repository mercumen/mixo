"use client";

import { CalendarDays, Check } from "lucide-react";
import { setupSteps, type SetupStepId } from "@/lib/setup-steps";
import { cn } from "@/lib/utils";

/**
 * Sihirbazın sol rayı: etkinlik başlığı + 5 adım.
 *
 * Adım listesi `lib/setup-steps.ts`'ten geliyor — Genel Bakış'taki kontrol
 * listesi ve ilerleme yüzdesi de aynı kaynağı kullanıyor.
 */
export function WizardRail({
  eventName,
  dateLabel,
  currentStep,
  completedSteps,
  onStepClick,
  hintOverrides,
}: {
  eventName: string;
  dateLabel: string;
  currentStep: SetupStepId;
  completedSteps: string[];
  /** Tamamlanmış adıma geri dönmek için */
  onStepClick: (id: SetupStepId) => void;
  /**
   * Pakete göre değişen alt yazılar. Örnek: Essential'da AI görev üretimi
   * yok, o yüzden "AI ile kişiselleştirilmiş görevler" yazmamalı.
   */
  hintOverrides?: Partial<Record<SetupStepId, string>>;
}) {
  return (
    <div className="hidden w-[270px] shrink-0 flex-col bg-accent/40 p-7 md:flex">
      <p className="text-[11.5px] font-medium text-primary">Kurulum Sihirbazı</p>
      <h2 className="mt-1.5 text-[15px] leading-snug font-semibold tracking-tight">
        {eventName}
      </h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
        {dateLabel}
      </p>

      <ol className="mt-8 space-y-5">
        {setupSteps.map((step, index) => {
          const done = completedSteps.includes(step.id);
          const active = step.id === currentStep;
          // Tamamlanmış adımlara dönülebilir; ileriye atlanamaz
          const clickable = done || active;

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex w-full items-start gap-3 text-left",
                  clickable ? "cursor-pointer" : "cursor-default",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "mt-px grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && !done && "border-primary text-primary",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[12.5px] font-semibold",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {hintOverrides?.[step.id] ?? step.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
