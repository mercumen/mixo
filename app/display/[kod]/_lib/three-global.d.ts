/**
 * THREE global olarak yükleniyor (CDN script'i), npm bağımlılığı olarak
 * DEĞİL — CLAUDE.md yeni bağımlılık eklemeden önce sormayı şart koşuyor,
 * o karar alınana kadar demo'nun kullandığı yolu koruyoruz.
 *
 * Tip `unknown` bırakıldı: sahne motoru zaten `@ts-nocheck` altında ve
 * tipleri olmayan bir global için uydurma bir arayüz yazmak yanlış güven
 * verirdi. Buradaki tek amaç "var mı yok mu" kontrolünün derlenmesi.
 */
declare global {
  interface Window {
    THREE?: unknown;
  }
}

export {};
