"use client";

/**
 * Cümlenin altındaki seçenek düğmeleri (etkinlik türü, katılımcı sayısı).
 *
 * Radio input değil buton: seçim anında cümleyi dolduruyor ve bir sonraki
 * adıma geçiyor, yani bir form alanı değil bir eylem. Seçili olan `aria-current`
 * ile işaretli.
 */
export function ChoiceChips<T extends string>({
  options,
  value,
  onSelect,
  groupLabel,
}: {
  options: { id: T; label: string }[];
  value: T | null;
  onSelect: (id: T) => void;
  groupLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="mt-9 flex flex-wrap items-center justify-center gap-3"
    >
      {options.map(({ id, label }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={selected ? "true" : undefined}
            className={`rounded-[10px] border px-5 py-3 text-[12.5px] font-medium transition-colors duration-200 ${
              selected
                ? "border-current bg-white/8 text-fg"
                : "border-line bg-white/4 text-fg/80 hover:border-line-strong hover:bg-white/8 hover:text-fg"
            }`}
            style={selected ? { color: "var(--accent)" } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
