"use client";

import type { ReactNode } from "react";

/**
 * Cümle kurma ekranının parçaları.
 *
 * Tasarımdaki fikir: form alanları yerine bir cümle doldurulan boşluklar.
 * Beyaz sans metin sabit, doldurulan değerler altın serif.
 */

/** Cümle satırı. Cevaplanmamış satırlar hiç basılmıyor (kademeli açılıyor). */
export function SentenceLine({ children }: { children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-center text-[clamp(1.15rem,2.5vw,1.75rem)] leading-[1.5] font-medium">
      {children}
    </p>
  );
}

/** Henüz doldurulmamış boşluk: altı çizili, soluk. */
export function EmptySlot({ label }: { label: string }) {
  return (
    <span className="border-b border-line-strong pb-0.5 font-serif text-fg-subtle italic">
      {label}
    </span>
  );
}

/**
 * Doldurulmuş boşluk: altın serif değer + yanında değiştirme düğmesi.
 * Düğme gerçek bir <button>; o adıma geri dönüyor.
 */
export function FilledSlot({
  value,
  onChange,
  changeLabel,
}: {
  value: string;
  onChange: () => void;
  changeLabel: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className="font-serif break-words"
        style={{ color: "var(--accent)" }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onChange}
        aria-label={changeLabel}
        title={changeLabel}
        className="translate-y-[-0.35em] rounded-full p-0.5 text-fg-subtle transition-colors duration-200 hover:text-fg"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-[13px]"
        >
          <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" />
          <path d="M4 4v4.5h4.5" />
          <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
          <path d="M20 20v-4.5h-4.5" />
        </svg>
      </button>
    </span>
  );
}

/** Cümlenin içine gömülü metin girişi (etkinlik adı). */
export function SlotInput({
  value,
  onValueChange,
  placeholder,
  id,
  disabled,
}: {
  value: string;
  onValueChange: (next: string) => void;
  placeholder: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      /* pointer-events yetmiyor: odak alanda kalırsa klavyeyle yazılabilir */
      disabled={disabled}
      // Adım açıldığında odak doğrudan buraya: ekranda tek soru var
      autoFocus
      maxLength={80}
      /* field-sizing-content: girdi yazıldıkça genişliyor. Desteklemeyen
         tarayıcıda min genişlikte kalır — bozulmaz, sadece sabit durur. */
      /* Mobilde kendi satırını alıyor (uzun placeholder cümleyi taşırıyordu),
         sm ve üstünde cümlenin içinde yazıldıkça genişliyor. */
      className="w-full max-w-full border-b border-line-strong bg-transparent pr-2 pb-0.5 text-center font-serif italic outline-none transition-colors duration-200 placeholder:text-fg-subtle focus:border-current sm:w-auto sm:min-w-[14ch] sm:text-left sm:field-sizing-content"
      style={{ color: "var(--accent)" }}
    />
  );
}

/** Cümle altındaki italik açıklama. */
export function StepHint({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-8 max-w-[430px] text-center text-[11.5px] leading-relaxed font-light text-fg-subtle italic">
      {children}
    </p>
  );
}
