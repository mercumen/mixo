"use client";

import { useId, useState } from "react";

/** Kimlik ekranlarındaki standart giriş alanı. */
export function AuthField({
  label,
  value,
  onValueChange,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus,
}: {
  /** Görünmüyor — placeholder tasarımda etiketin yerini tutuyor. */
  label: string;
  value: string;
  onValueChange: (next: string) => void;
  type?: "text" | "email" | "password";
  placeholder: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="relative">
      {/* Tasarımda görsel etiket yok; ekran okuyucu için gerekli */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        // Her ekranda tek alan var; odak gitmezse kullanıcı boşa tıklıyor
        autoFocus={autoFocus}
        className={`h-11 w-full rounded-[10px] border border-line bg-white/4 px-4 text-[13px] text-fg outline-none transition-colors duration-200 placeholder:text-fg-subtle hover:border-line-strong focus:border-line-strong ${
          isPassword ? "pr-11" : ""
        }`}
      />
      {isPassword ? (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={revealed}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-fg-subtle transition-colors duration-200 hover:text-fg"
        >
          <EyeIcon crossed={revealed} />
        </button>
      ) : null}
    </div>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[17px]"
    >
      <path d="M2.5 12S6 5.8 12 5.8S21.5 12 21.5 12S18 18.2 12 18.2S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {crossed ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}
