"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCw, Vibrate, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadRecord } from "../_lib/storage";
import { CtaButton, Logo, PhotoStack, PolaroidScatter, ProgressDots } from "./chrome";

/**
 * Görev ekranları: açılış ("telefonu sallayın") + görev kartı.
 */

// --- Açılış: "İlk Göreviniz Hazır" -------------------------------------------

/**
 * Sallama algılama: ivme vektörünün ani değişimine bakıyor.
 *
 * iOS 13+ hareket sensörünü kullanıcı jestiyle izin istemeye bağladı — o
 * yüzden "ya da buraya dokunun" süs değil, iOS'taki ASIL yol. Android'de
 * sallama doğrudan çalışıyor.
 */
function useShake(onShake: () => void) {
  const fired = useRef(false);

  useEffect(() => {
    const last = { x: 0, y: 0, z: 0, ready: false };

    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      if (last.ready) {
        const delta =
          Math.abs(acc.x - last.x) +
          Math.abs(acc.y - last.y) +
          Math.abs(acc.z - last.z);
        if (delta > 30 && !fired.current) {
          fired.current = true;
          onShake();
        }
      }
      last.x = acc.x;
      last.y = acc.y;
      last.z = acc.z;
      last.ready = true;
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [onShake]);
}

export function RevealScreen({ onReveal }: { onReveal: () => void }) {
  useShake(onReveal);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden pb-28">
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <PhotoStack />
        <h1 className="mt-8 text-3xl font-extrabold text-gray-900">
          İlk Göreviniz Hazır
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          Görmek için <span className="font-bold text-gray-800">telefonu sallayın</span>
          <br />
          ya da{" "}
          <button
            type="button"
            onClick={onReveal}
            className="font-bold text-gray-800 underline underline-offset-2"
          >
            buraya dokunun
          </button>
        </p>
        <Vibrate className="mt-6 h-6 w-6 text-gray-400" />
      </div>
    </div>
  );
}

// --- Görev kartı ---------------------------------------------------------------

const ordinals = ["İlk", "İkinci", "Üçüncü", "Dördüncü", "Beşinci", "Altıncı"];

function ordinalLabel(index: number) {
  const word = ordinals[index] ?? `${index + 1}.`;
  return `${word} Görevini Yap!`;
}

export type MissionCardState =
  | { kind: "gorev"; missionLabel: string; upload: UploadRecord | null }
  /** Bütün görevler bitti ya da hak kalmadı */
  | { kind: "bitti"; reason: "gorevler" | "hak" };

export function MissionScreen({
  state,
  index,
  total,
  busy,
  error,
  onCapture,
  onRetry,
  onDismissStatus,
  onNext,
  onBrowseFeed,
}: {
  state: MissionCardState;
  index: number;
  total: number;
  busy: boolean;
  error: string | null;
  onCapture: (file: File) => void;
  onRetry: () => void;
  onDismissStatus: () => void;
  onNext: () => void;
  onBrowseFeed: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [statusHidden, setStatusHidden] = useState(false);

  const upload = state.kind === "gorev" ? state.upload : null;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden pb-28">
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>

      <div className="relative flex flex-1 items-center px-5">
        <div className="w-full rounded-[32px] bg-gradient-to-br from-violet-100/90 via-white to-white p-7 shadow-[0_18px_60px_rgba(40,20,90,0.14)]">
          {/* Kamera rozeti */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg shadow-violet-600/30">
            <Camera className="h-7 w-7" />
          </div>

          <div className="mt-5">
            <ProgressDots total={total} current={Math.min(index, total - 1)} />
          </div>

          {state.kind === "gorev" ? (
            <>
              <p className="mt-4 text-center text-[15px] font-semibold text-gray-700">
                {ordinalLabel(index)}
              </p>
              <h2 className="mt-1 text-center text-2xl font-extrabold leading-snug text-gray-900">
                {state.missionLabel}
              </h2>
            </>
          ) : (
            <>
              <p className="mt-4 text-center text-[15px] font-semibold text-gray-700">
                {state.reason === "gorevler"
                  ? "Hepsi tamam!"
                  : "Fotoğraf hakkın doldu"}
              </p>
              <h2 className="mt-1 text-center text-2xl font-extrabold leading-snug text-gray-900">
                {state.reason === "gorevler"
                  ? "Tüm görevlerini tamamladın 🎉"
                  : "Karelerini akıştan izleyebilirsin"}
              </h2>
            </>
          )}

          {/* Yükleme durumu satırı */}
          {upload && !statusHidden && (
            <div className="mt-6 flex items-center gap-3">
              {upload.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL önizleme
                <img
                  src={upload.thumb}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100" />
              )}
              {upload.status === "sent" ? (
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    Gönderildi
                  </p>
                  <p className="text-sm text-gray-500">İnceleniyor</p>
                </div>
              ) : (
                <button type="button" onClick={onRetry} className="text-left">
                  <p className="text-[15px] font-bold text-red-600">
                    Gönderilemedi
                  </p>
                  <p className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <RotateCw className="h-3.5 w-3.5" /> Tekrar denemek için dokun
                  </p>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStatusHidden(true);
                  onDismissStatus();
                }}
                aria-label="Kapat"
                className="ml-auto p-1 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          {/* Ana buton */}
          <div className={cn("mt-6", upload && !statusHidden && "mt-5")}>
            {state.kind === "bitti" ? (
              <CtaButton onClick={onBrowseFeed}>Akışa Göz At</CtaButton>
            ) : upload?.status === "sent" ? (
              <CtaButton
                onClick={() => {
                  setStatusHidden(false);
                  onNext();
                }}
              >
                Sıradaki Göreve Geç
              </CtaButton>
            ) : (
              <CtaButton
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? "Gönderiliyor…" : "Fotoğraf Çek / Yükle"}
              </CtaButton>
            )}
          </div>
        </div>
      </div>

      {/*
        capture="environment": galeri kapalı, canlı kamera açılıyor (CLAUDE.md).
        Masaüstü tarayıcı capture'ı tanımaz, dosya seçiciye düşer — demo lokalde
        de çalışsın diye buna ses çıkarmıyoruz.
      */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setStatusHidden(false);
            onCapture(file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * ÇEKİM ONAY EKRANI.
 *
 * Tasarımda yoktu, sonradan eklendi: eskiden shutter'a basılan an fotoğraf
 * doğrudan yükleniyordu — misafir kapağı kapatan başparmağını ya da bulanık
 * kareyi göremiyordu. Üç şeyi birden çözüyor: misafir kötü kareyi kendi eler,
 * moderasyon yükü düşer, hak boşa gitmez.
 *
 * Kredi bu ekranda HARCANMIYOR. Rezervasyon ancak "Gönder"e basılınca
 * açılıyor; "Yeniden Çek" hiçbir sayaca dokunmuyor.
 *
 * Görsel dil mevcut ekranlardan alındı (aynı kart, aynı CtaButton) —
 * gönderdiğin tasarımda bu ekran olmadığı için uydurma bir stil açmadım.
 */
export function ConfirmScreen({
  previewUrl,
  missionLabel,
  busy,
  onSend,
  onRetake,
}: {
  previewUrl: string;
  missionLabel: string;
  busy: boolean;
  onSend: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden pb-28">
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>

      <div className="relative flex flex-1 items-center px-5">
        <div className="w-full rounded-[32px] bg-gradient-to-br from-violet-100/90 via-white to-white p-7 shadow-[0_18px_60px_rgba(40,20,90,0.14)]">
          <p className="text-center text-[15px] font-semibold text-gray-700">
            Bu kareyi gönderelim mi?
          </p>
          <h2 className="mt-1 text-center text-lg font-extrabold leading-snug text-gray-900">
            {missionLabel}
          </h2>

          {/* Polaroid çerçeve: gönderilen karenin ekranda nasıl görüneceğine yakın */}
          <div className="mt-5 rounded-2xl bg-white p-2.5 shadow-[0_10px_30px_rgba(40,20,90,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL önizleme */}
            <img
              src={previewUrl}
              alt="Çektiğin fotoğrafın önizlemesi"
              className="max-h-[46vh] w-full rounded-xl object-contain"
            />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Gönderdikten sonra geri alınamaz — beğenmediysen yeniden çekebilirsin.
          </p>

          <div className="mt-6 space-y-3">
            <CtaButton disabled={busy} onClick={onSend}>
              {busy ? "Gönderiliyor…" : "Gönder"}
            </CtaButton>
            <button
              type="button"
              disabled={busy}
              onClick={onRetake}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-[15px] font-semibold text-gray-700 disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              Yeniden Çek
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
