/**
 * Referans logo şeridi.
 *
 * Logolar gerçek: müşterinin gönderdiği görsellerden beyaz monokrom +
 * şeffaf zemine çevrildi (koyu temada tek tip dursunlar diye).
 * Kaynaklar `public/gorseller/logolar/` altında.
 *
 * Yükseklikler logo başına ayrı: her markanın görsel ağırlığı farklı —
 * kare/dikey logolar (TTV, AURAMIND) yatay wordmark'larla (incom) aynı
 * yükseklikte basılırsa cılız görünüyor.
 */

const logos = [
  { name: "incom", src: "/gorseller/logolar/incom.png", h: "h-6" },
  { name: "AURAMIND", src: "/gorseller/logolar/auramind.png", h: "h-9" },
  {
    name: "Türkiye Tasarım Vakfı",
    src: "/gorseller/logolar/ttv.png",
    h: "h-10",
  },
  { name: "JCI Türkiye", src: "/gorseller/logolar/jci.png", h: "h-8" },
] as const;

export function LogoMarquee() {
  // Şeridi çoğaltıyoruz; animasyon -%50 kaydırınca dikiş görünmez.
  const track = [...logos, ...logos, ...logos];

  return (
    <div
      className="relative w-full overflow-hidden lg:max-w-[620px]"
      // Kenarlarda yumuşak kesim — logolar aniden bitmesin
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="animate-marquee flex w-max items-center">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
          >
            {track.map((logo, i) => (
              <li
                key={`${logo.name}-${i}`}
                className="flex h-12 shrink-0 items-center justify-center px-9"
              >
                {/* Dekoratif tekrar eden şerit — next/image'ın getirisi yok,
                    dosyalar zaten 3-13 KB optimize PNG */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={`${logo.h} w-auto opacity-75`}
                  loading="lazy"
                  draggable={false}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
