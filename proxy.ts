import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

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
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const url = new URL("/giris", request.url);
    // Giriş sonrası kullanıcıyı gitmek istediği sayfaya döndürebilmek için
    url.searchParams.set("devam", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Sadece panel. Pazarlama sitesi, kurulum akışı ve API rotaları serbest —
  // API'ler kendi token doğrulamalarını yapıyor.
  matcher: ["/dashboard", "/dashboard/:path*"],
};
