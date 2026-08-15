"use client";

import { useState } from "react";

/**
 * Parola formu. Başarıda hedef sayfaya tam yenilemeyle dönüyoruz
 * (`location.replace`): çerez HttpOnly, istemci router'ının haberi olmaz;
 * proxy'nin çerezi görmesi için isteğin sunucuya gitmesi gerekiyor.
 *
 * `devam` parametresi render'da değil tıklama anında okunuyor — sayfa statik
 * kalsın, Suspense zorunluluğu doğmasın (useSearchParams tuzağı).
 */
export function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Parola yanlış.");
        setBusy(false);
        return;
      }

      const devam = new URLSearchParams(window.location.search).get("devam");
      // Sadece site içi hedefe dön — açık yönlendirme kapısı bırakma
      const target = devam?.startsWith("/") ? devam : "/";
      window.location.replace(target);
    } catch {
      setError("Bağlanılamadı, tekrar deneyin.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label htmlFor="gate-password" className="sr-only">
        Erişim parolası
      </label>
      <input
        id="gate-password"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Erişim parolası"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-violet/60"
      />
      {error && (
        <p role="alert" className="text-center text-[13px] text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full rounded-xl bg-white px-4 py-3 text-[15px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Kontrol ediliyor…" : "Devam Et"}
      </button>
    </form>
  );
}
