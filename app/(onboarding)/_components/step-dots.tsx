/**
 * Alt taraftaki adım göstergesi. Aktif adım kısa bir çizgi, diğerleri nokta.
 *
 * Adım sayısı prop'tan geliyor — telefondan çekilen Figma görüntülerinde
 * işaret sayısını net sayamadım (4-5 gibi duruyor). Cümlede net görünen 3 adım
 * var; 4. adım varsa `total` artırılınca gösterge kendiliğinden uyar.
 */
export function StepDots({
  current,
  total,
}: {
  /** 0 tabanlı */
  current: number;
  total: number;
}) {
  return (
    <div className="mt-14 flex flex-col items-center gap-2">
      <div aria-hidden="true" className="flex items-center gap-2.5">
        {Array.from({ length: total }, (_, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                active ? "h-[3px] w-5" : "size-[3px]"
              } ${done ? "bg-fg-muted" : active ? "" : "bg-fg-subtle/45"}`}
              style={active ? { backgroundColor: "var(--accent)" } : undefined}
            />
          );
        })}
      </div>
      {/* Gösterge dekoratif; adım bilgisini ekran okuyucuya metinle veriyoruz */}
      <p className="sr-only" aria-live="polite">
        Adım {current + 1} / {total}
      </p>
    </div>
  );
}
