"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CtaButton,
  Logo,
  PhotoStack,
  PolaroidScatter,
  SecondaryAction,
} from "./chrome";

/**
 * Giriş ekranları: splash → karşılama → isim.
 *
 * Üçü de aynı sahne düzenini paylaşıyor (logo üstte, polaroid serpintisi
 * kenarlarda) — QR'dan gelen misafirin gözünde tek akıcı sahne gibi dursun.
 */

// --- 1. Splash: "Zirvenin Anıları Burada Başlıyor." -------------------------

export function SplashScreen({ onStart }: { onStart: () => void }) {
  const touchStartY = useRef<number | null>(null);

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartY.current;
        const end = e.changedTouches[0]?.clientY;
        // Yukarı kaydırma: parmak en az 60px yukarı gittiyse başlat
        if (start != null && end != null && start - end > 60) onStart();
        touchStartY.current = null;
      }}
    >
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>

      <div className="relative flex flex-1 items-center justify-center px-8">
        <h1 className="text-center text-[32px] font-extrabold leading-tight text-gray-900">
          Zirvenin Anıları
          <br />
          Burada Başlıyor.
        </h1>
      </div>

      {/* Yer tutucu: kubbe absolute, akışta yerini bu koruyor */}
      <div className="h-36" />

      {/* Alt kubbe: dokunulabilir de — masaüstünde kaydırma olmayabilir */}
      <button
        type="button"
        onClick={onStart}
        className="absolute -bottom-10 left-1/2 flex h-48 w-[130%] -translate-x-1/2 flex-col items-center gap-3 rounded-t-[100%] bg-gradient-to-b from-violet-50 to-white pt-10 shadow-[0_-12px_40px_rgba(90,50,180,0.08)]"
      >
        <ArrowUp className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-500">
          Macerayı başlatmak için yukarıya kaydırın
        </span>
      </button>
    </div>
  );
}

// --- 2. Karşılama: "Bu Gece Bir Hikaye Yazılıyor" ---------------------------

/**
 * Etkinlik adına Türkçe bulunma eki: "Zeynep & Can Düğünü'nde",
 * "2027 Ürün Lansmanı'nda", "Bahar Festivali 2027'de".
 *
 * Kusursuz Türkçe morfolojisi değil, ünlü uyumu sezgisi — yaygın etkinlik
 * adlarında doğru sonucu veriyor. Emin olamadığı harflerde 'de'ye düşüyor.
 */
export function locativeSuffix(name: string): string {
  const trimmed = name.trim();
  const last = trimmed.slice(-1).toLocaleLowerCase("tr-TR");

  // Rakamla bitenler: sayının okunuşuna göre (2027 → "yedi" → 'de)
  const digitSuffix: Record<string, string> = {
    "0": "'da", "1": "'de", "2": "'de", "3": "'te", "4": "'te",
    "5": "'te", "6": "'da", "7": "'de", "8": "'de", "9": "'da",
  };
  if (digitSuffix[last]) return digitSuffix[last];

  const vowels = "aeıioöuü";
  const back = "aıou";
  const lastVowel = [...trimmed.toLocaleLowerCase("tr-TR")]
    .reverse()
    .find((ch) => vowels.includes(ch));

  const hard = "fstkçşhp".includes(last);
  const suffixVowel = lastVowel && back.includes(lastVowel) ? "a" : "e";

  if (vowels.includes(last)) return `'nd${suffixVowel}`;
  return hard ? `'t${suffixVowel}` : `'d${suffixVowel}`;
}

export function WelcomeScreen({
  eventName,
  onJoin,
  onBrowseFeed,
}: {
  eventName: string;
  onJoin: () => void;
  onBrowseFeed: () => void;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>

      <PhotoStack className="relative mt-10" />

      <div className="relative mt-auto px-6 pb-6">
        <h1 className="text-center text-[28px] font-extrabold leading-tight text-gray-900">
          Bu Gece Bir Hikaye Yazılıyor
        </h1>
        <p className="mt-2 text-center text-[15px] text-gray-600">
          <span className="font-bold text-gray-800">{eventName}</span>
          {locativeSuffix(eventName)} objektif bu kez sende.
        </p>

        <div className="mt-6">
          <CtaButton onClick={onJoin}>Maceraya Başla</CtaButton>
          <div className="mt-3">
            <SecondaryAction label="Akışa Göz At" onClick={onBrowseFeed} />
          </div>
          <ArrowDown className="mx-auto mt-1 h-4 w-4 text-gray-400" />
        </div>

        <PhotoStack className="mt-4 opacity-90" />
      </div>
    </div>
  );
}

// --- 3. İsim: "Hello, [Tam Adınız]" ------------------------------------------

export function NameScreen({
  busy,
  error,
  onSubmit,
  onBack,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const canSubmit = name.trim().length >= 2 && !busy;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="relative pt-12">
        <Logo />
      </header>

      {/* Ortadaki yumuşak ışıma — tasarımdaki gri hale */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-200/60 blur-3xl"
      />

      <form
        className="relative flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(name.trim());
        }}
      >
        <div className="flex flex-1 items-center justify-center gap-3 px-6">
          <span className="text-4xl font-extrabold text-gray-900">Hello,</span>
          <div className="relative">
            {!focused && name === "" && (
              <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                <Plus className="h-3.5 w-3.5" />
              </span>
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Tam Adınız"
              maxLength={60}
              autoComplete="name"
              /* 16px altı font iOS'ta odaklanınca sayfayı zoom'latıyor */
              className={cn(
                "w-48 rounded-2xl border-2 border-dashed border-violet-400 bg-transparent py-3 text-center text-base font-semibold text-violet-600 placeholder:text-violet-300 focus:outline-none",
                !focused && name === "" ? "pl-8 pr-3" : "px-3",
              )}
            />
          </div>
        </div>

        <div className="px-6 pb-10">
          {error && (
            <p className="mb-3 text-center text-sm text-red-600">{error}</p>
          )}
          <CtaButton disabled={!canSubmit} onClick={() => onSubmit(name.trim())}>
            {busy ? (
              "Bağlanıyor…"
            ) : (
              <span className="inline-flex items-center gap-2">
                Devam Et <span aria-hidden>→</span>
              </span>
            )}
          </CtaButton>
          <div className="mt-3">
            <SecondaryAction label="Geri Dön" onClick={onBack} />
          </div>
          {/* KVKK açık rıza — sunucu bunsuz oturum açmıyor */}
          <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
            Devam ederek fotoğraflarının etkinlik ekranında gösterilmesine ve
            KVKK aydınlatma metnine onay vermiş olursun.
          </p>
        </div>
      </form>
    </div>
  );
}
