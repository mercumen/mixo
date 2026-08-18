import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

/**
 * Panel için ilk kapı. (Next 16'da bu dosyanın adı `proxy.ts` — `middleware.ts`
 * deprecated oldu.)
 *
 * BURADA SADECE "ÇEREZ VAR MI" BAKILIYOR, doğrulama yapılmıyor.
 *
 * Next 16'da proxy Node.js runtime'ında çalışıyor, yani teknik olarak Firebase
 * Admin SDK'yı buraya koyup çerezi burada doğrulayabilirdik. Yapmıyoruz çünkü:
 *
 *   1. Proxy her eşleşen istekte çalışıyor — statik dosya, RSC isteği, hepsi.
 *      Her birine bir Admin SDK başlatması + Firestore okuması bindirmek
 *      hem yavaş hem faturalı (CLAUDE.md okuma kotasına duyarlı).
 *   2. Next'in kendi dokümanı proxy'yi "başka seçenek yoksa" kullanmayı
 *      öneriyor ve "render kodundan bağımsız, CDN'e taşınabilir" olduğunu
 *      söylüyor — paylaşılan modüllere yaslanmamak gerekiyor.
 *
 * Bu yüzden iş ikiye bölünmüş:
 *   proxy  → çerez yoksa hiç render etmeden /giris'e at   (ucuz, iyimser)
 *   layout → çerezi Admin SDK ile doğrula, geçersizse at  (kesin, otoriter)
 *
 * DİKKAT — yönlendirme döngüsü riski: burada "çerez varsa /giris'ten
 * /dashboard'a at" YAPMIYORUZ. Çerez süresi geçmişse layout /giris'e atar,
 * proxy tekrar /dashboard'a atardı ve sonsuz döngü olurdu.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * ---- SİTE KİLİDİ (geçici, lansmana kadar) ----------------------------
   * Proje gizli: parolayı bilmeyen HİÇBİR sayfayı göremiyor. Kilit ekranı
   * ve parola doğrulama ucu hariç her yol çerez ister. Kaldırma talimatı
   * lib/gate.ts başında.
   */
  /**
   * `/api/cron/*` kilidin DIŞINDA: Vercel Cron kendi çağrısını yaparken
   * kilit çerezi taşımıyor, kilit açıkken zamanlanmış işler sessizce
   * 401 alıp hiç çalışmazdı. O uçlar kendi `CRON_SECRET`'ıyla korunuyor.
   */
  const gateExempt =
    pathname === "/kilit" ||
    pathname === "/api/gate" ||
    pathname.startsWith("/api/cron/");

  if (!gateExempt) {
    const expected = gateToken();
    const unlocked =
      expected !== null &&
      request.cookies.get(GATE_COOKIE)?.value === expected;

    // GATE_PASSWORD tanımsızsa kilit devre dışı (env'i silmek = kilidi kaldırmak)
    if (expected !== null && !unlocked) {
      // API çağrıları HTML redirect değil dürüst bir 401 alsın
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Kilitli." }, { status: 401 });
      }
      const url = new URL("/kilit", request.url);
      if (pathname !== "/") url.searchParams.set("devam", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ---- Panel koruması (kalıcı) -------------------------------------------
  if (pathname.startsWith("/dashboard")) {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    if (!hasSession) {
      const url = new URL("/giris", request.url);
      // Giriş sonrası kullanıcıyı gitmek istediği sayfaya döndürebilmek için
      url.searchParams.set("devam", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Kilit yüzünden artık neredeyse her yol eşleşiyor. Hariç tutulanlar:
   * Next'in kendi statikleri (font/chunk — kilit sayfasının da ihtiyacı var)
   * ve dosya uzantılı public varlıklar (favicon vs.). Sayfa İÇERİĞİ değil
   * süs dosyaları; sızdırdıkları bir şey yok.
   */
  matcher: [
    "/((?!_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|webmanifest)$).*)",
  ],
};
