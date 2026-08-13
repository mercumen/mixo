"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/app/_components/wordmark";
import { ArrowRightIcon } from "@/app/(marketing)/_components/icons";
import {
  checkEmail,
  sendPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "../_lib/auth";
import type { EventDraft } from "../_lib/event-setup";
import { AuthField } from "./auth-field";
import { OnboardingShell } from "./onboarding-shell";

/**
 * Kimlik akışı: e-posta → (kayıtlı mı?) → giriş ya da kayıt.
 *
 * İki bağlamda kullanılıyor ve kopya buna göre değişiyor:
 *  - Kurulum akışının sonunda → `eventName` dolu, etkinlik adı altın serifle
 *    başlığın altında görünüyor ("… altyapısını hazırlıyoruz.")
 *  - Nav'daki "Giriş Yap" ile doğrudan → `eventName` yok, genel kopya
 *
 * Not: e-postanın kayıtlı olup olmadığını bu kadar net söylemek kullanıcı
 * numaralandırmaya açık kapı bırakıyor. Tasarım iki ayrı ekran istediği için
 * böyle; canlıya çıkmadan önce hız sınırı konmalı
 * (bkz. app/api/auth/check-email/route.ts).
 */

type Mode =
  | { kind: "email" }
  | { kind: "signup"; email: string }
  | { kind: "login"; email: string };

export function AuthPanel({
  accent,
  eventName,
  draft,
}: {
  accent?: string;
  eventName?: string;
  /**
   * Kurulum akışından geliyorsa taslak burada. Etkinlik hesap açıldıktan
   * SONRA yazılıyor — `ownerUid` olmadan Firestore'a yazılamaz.
   */
  draft?: EventDraft;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "email" });
  const router = useRouter();

  /**
   * Giriş/kayıt başarılı. `replace` kullanıyoruz: kullanıcı geri tuşuyla
   * kimlik ekranına dönmesin.
   *
   * `?devam=` proxy'den geliyor (korunan bir sayfaya girmeye çalışmıştı).
   *
   * `useSearchParams` KULLANMIYORUZ: o hook statik prerender'da Suspense
   * sınırı istiyor ve giriş ekranında bir an boş içerik gösterilmesine yol
   * açıyor. Parametreye sadece tıklama anında ihtiyacımız var, o da zaten
   * istemcide çalışıyor — doğrudan adres çubuğundan okuyoruz.
   *
   * Değeri DOĞRULUYORUZ: dışarıdan gelen bir parametreyi doğrudan yönlendirme
   * hedefi yapmak açık yönlendirme (open redirect) açığı olur — saldırgan
   * `/giris?devam=https://kotu-site` ile kullanıcıyı kendi sitesine
   * yönlendirebilirdi. Sadece kendi panelimizin yolları kabul ediliyor.
   */
  /**
   * @param isNewAccount Yeni hesap mı açıldı?
   *   Yeni hesap → hiç etkinliği yok, tek yapacağı iş etkinlik kurmak,
   *               doğrudan Kurulum Sihirbazı'na alıyoruz.
   *   Mevcut hesap → etkinlikleri olabilir, panele bırakıyoruz.
   */
  async function onAuthenticated(isNewAccount: boolean) {
    // Kurulum akışından geldiysek etkinliği şimdi yaratıyoruz. Hata olursa
    // panele yine gidiyoruz: hesap açıldı, etkinliği panelden de yaratabilir.
    /**
     * Taslağı BURADA KAYDETMİYORUZ.
     *
     * Landing akışı paket adımında zaten oturuma yazdı (paket dahil). Burada
     * tekrar yazsaydık paket alanını sıfırlardık — `draft` prop'unda paket
     * bilgisi yok.
     *
     * Etkinlik de burada yaratılmıyor: Kurulum Sihirbazı'nda doğuyor.
     */
    const requested = new URLSearchParams(window.location.search).get("devam");
    const safe =
      requested &&
      requested.startsWith("/dashboard") &&
      // "//kotu-site" protokolden bağımsız mutlak URL olur, onu da eleriz
      !requested.startsWith("//")
        ? requested
        : "/dashboard";

    /**
     * Landing akışından geldiyse Kurulum Sihirbazı'nı doğrudan açıyoruz.
     * Kullanıcı zaten "etkinliğimi kur" niyetiyle geldi; panele bırakıp
     * "şimdi de şu düğmeye bas" demek akışı kırıyor. Ad ve tür sihirbazda
     * önceden dolu geliyor.
     */
    /**
     * Yeni hesap ya da landing akışından gelen → etkinlik oluşturma ekranı.
     * `?devam=` ile korunan bir sayfaya gitmek isteyen mevcut kullanıcı → oraya.
     */
    router.replace(isNewAccount || draft ? "/dashboard?kurulum=1" : safe);
  }

  return (
    <OnboardingShell accent={accent}>
      <div className="w-full max-w-[340px]">
        <div className="flex flex-col items-center">
          <Wordmark size="md" />
        </div>

        {mode.kind === "email" ? (
          <EmailStep onResolved={setMode} onAuthenticated={onAuthenticated} />
        ) : mode.kind === "signup" ? (
          <SignupStep
            email={mode.email}
            eventName={eventName}
            onChangeEmail={() => setMode({ kind: "email" })}
            onAuthenticated={onAuthenticated}
          />
        ) : (
          <LoginStep
            email={mode.email}
            eventName={eventName}
            onChangeEmail={() => setMode({ kind: "email" })}
            onAuthenticated={onAuthenticated}
          />
        )}
      </div>
    </OnboardingShell>
  );
}

/** Başlık + altındaki bağlam cümlesi. */
function Heading({
  title,
  eventName,
  withEvent,
  without,
}: {
  title: string;
  eventName?: string;
  /** Etkinlik adından SONRA gelen cümle. */
  withEvent: string;
  /** Etkinlik bağlamı yoksa gösterilen cümle. */
  without: string;
}) {
  return (
    <div className="mt-7 text-center">
      <h1 className="text-[17px] font-bold tracking-tight">{title}</h1>
      {eventName ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
          <span
            className="font-serif text-[15px] italic"
            style={{ color: "var(--accent)" }}
          >
            {eventName}
          </span>
          <br />
          {withEvent}
        </p>
      ) : (
        <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
          {without}
        </p>
      )}
    </div>
  );
}

/** Değiştirilebilir e-posta rozeti. */
function EmailChip({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  return (
    <div className="mt-5 flex justify-center">
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white/6 py-1.5 pr-2 pl-3.5">
        <span className="min-w-0 truncate text-[11.5px] text-fg-muted">
          {email}
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          aria-label="E-posta adresini değiştir"
          title="E-posta adresini değiştir"
          className="grid size-4 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors duration-200 hover:text-fg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-2.5"
          >
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </button>
      </span>
    </div>
  );
}

/** Form altındaki hata satırı. Boşken hiç yer kaplamıyor. */
function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-[11.5px] leading-relaxed text-red-300"
    >
      {message}
    </p>
  );
}

const submitButton =
  "mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[12.5px] font-semibold whitespace-nowrap text-ink transition-colors duration-200 hover:bg-white/88 disabled:pointer-events-none disabled:opacity-40";

// --- 1. adım: e-posta ------------------------------------------------------
function EmailStep({
  onResolved,
  onAuthenticated,
}: {
  onResolved: (mode: Mode) => void;
  onAuthenticated: (isNewAccount: boolean) => void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<false | "email" | "google">(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const value = email.trim();
    if (value.length === 0 || busy) return;
    setBusy("email");
    setError(null);
    try {
      const { exists } = await checkEmail(value);
      onResolved(
        exists ? { kind: "login", email: value } : { kind: "signup", email: value },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontrol edilemedi.");
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
    setBusy("google");
    setError(null);
    try {
      const { isNewAccount } = await signInWithGoogle();
      await onAuthenticated(isNewAccount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş yapılamadı.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-7 text-center">
        <h1 className="text-[17px] font-bold tracking-tight">
          Mixo&apos;ya Hoş Geldiniz.
        </h1>
        <p className="mt-2 text-[12.5px] text-fg-muted">
          Başlamak için giriş yapın veya kaydolun.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void google()}
        disabled={busy !== false}
        className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-[10px] border border-line bg-white/4 text-[12.5px] font-medium text-fg/80 transition-colors hover:bg-white/8 hover:text-fg disabled:pointer-events-none disabled:opacity-55"
      >
        <GoogleMark />
        {busy === "google" ? "Google'a bağlanılıyor…" : "Google ile Devam Et"}
      </button>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] text-fg-subtle">veya</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <AuthField
          label="E-posta veya telefon numarası"
          type="email"
          value={email}
          onValueChange={setEmail}
          placeholder="E-posta veya Telefon Numarası"
          autoComplete="email"
        />
        <p className="mt-3 text-center text-[11px] text-fg-subtle">
          Henüz hesabınız yoksa bir hesap oluşturacağız.
        </p>
        <button
          type="submit"
          disabled={email.trim().length === 0 || busy !== false}
          className={submitButton}
        >
          {busy === "email" ? "Kontrol ediliyor…" : "Devam Et"}
          {busy === "email" ? null : <ArrowRightIcon className="size-3.5" />}
        </button>
        <FormError message={error} />
      </form>
    </>
  );
}

// --- 2a. adım: kayıt -------------------------------------------------------
function SignupStep({
  email,
  eventName,
  onChangeEmail,
  onAuthenticated,
}: {
  email: string;
  eventName?: string;
  onChangeEmail: () => void;
  onAuthenticated: (isNewAccount: boolean) => void | Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = fullName.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signUpWithPassword({ email, password, fullName });
      await onAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hesap oluşturulamadı.");
      setBusy(false);
    }
  }

  return (
    <>
      <EmailChip email={email} onChangeEmail={onChangeEmail} />
      <Heading
        title="Aramıza Hoş Geldiniz."
        eventName={eventName}
        withEvent="altyapısını hazırlıyoruz. Şovunuzu başlatmak için bilgilerinizi tamamlayın."
        without="Şovunuzu başlatmak için bilgilerinizi tamamlayın."
      />

      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <AuthField
          label="Adınız soyadınız"
          value={fullName}
          onValueChange={setFullName}
          placeholder="Adınız Soyadınız"
          autoComplete="name"
          autoFocus
        />
        <AuthField
          label="Şifre belirleyin"
          type="password"
          value={password}
          onValueChange={setPassword}
          placeholder="Güvenli bir şifre belirleyin"
          autoComplete="new-password"
        />
        <p className="pt-1 text-center text-[10.5px] leading-relaxed text-fg-subtle">
          Hesap oluşturarak{" "}
          <Link href="#sozlesme" className="underline hover:text-fg-muted">
            Kullanıcı Sözleşmesi
          </Link>
          &apos;ni kabul etmiş olursunuz.
        </p>
        <button type="submit" disabled={!ready || busy} className={submitButton}>
          {busy ? "Hesap oluşturuluyor…" : "Hesabımı Tamamla ve Şova Başla"}
          {busy ? null : <ArrowRightIcon className="size-3.5" />}
        </button>
        <FormError message={error} />
      </form>
    </>
  );
}

// --- 2b. adım: giriş -------------------------------------------------------
function LoginStep({
  email,
  eventName,
  onChangeEmail,
  onAuthenticated,
}: {
  email: string;
  eventName?: string;
  onChangeEmail: () => void;
  onAuthenticated: (isNewAccount: boolean) => void | Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  /**
   * Şifre sıfırlama. Tasarımda ayrı bir ekran yok, o yüzden mail buradan
   * gidiyor ve bağlantının yerinde onay mesajı görünüyor.
   */
  async function resetPassword() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mail gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (password.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword({ email, password });
      await onAuthenticated(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş yapılamadı.");
      setBusy(false);
    }
  }

  return (
    <>
      <EmailChip email={email} onChangeEmail={onChangeEmail} />
      <Heading
        title="Tekrar Hoş Geldiniz."
        eventName={eventName}
        withEvent="yönetim paneline bağlanmak için şifrenizi girin."
        without="Kusursuz etkinlik deneyimlerinin yönetim merkezine kaldığınız yerden devam edin."
      />

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <AuthField
          label="Şifreniz"
          type="password"
          value={password}
          onValueChange={setPassword}
          placeholder="Şifreniz"
          autoComplete="current-password"
          autoFocus
        />
        <div className="mt-2 flex justify-end">
          {resetSent ? (
            <p role="status" className="text-[11px] text-fg-muted">
              Sıfırlama bağlantısı gönderildi, e-postanı kontrol et.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void resetPassword()}
              disabled={busy}
              className="text-[11px] text-fg-subtle transition-colors duration-200 hover:text-fg-muted disabled:opacity-50"
            >
              Şifremi unuttum
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={password.length === 0 || busy}
          className={submitButton}
        >
          {busy ? "Giriş yapılıyor…" : "Giriş Yap ve Şova Başla"}
          {busy ? null : <ArrowRightIcon className="size-3.5" />}
        </button>
        <FormError message={error} />
      </form>
    </>
  );
}

/** Google'ın renkli "G" işareti. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-[15px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H1.05v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H1.05a9 9 0 0 0 0 8.1l2.92-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 1.05 4.95l2.92 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
