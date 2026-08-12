/**
 * Referans logo şeridi.
 *
 * GEÇİCİ: Gerçek logolar SVG olarak gelmedi. Aşağıdakiler wordmark'ların
 * tipografik yaklaşımı. SVG'ler geldiğinde sadece `logos` dizisini değiştir.
 */

const logos = [
  { name: "Walther Kranz", kind: "split" },
  { name: "More", kind: "stacked" },
  { name: "GIS", kind: "plain" },
] as const;

function LogoMark({ logo }: { logo: (typeof logos)[number] }) {
  if (logo.kind === "split") {
    return (
      <span className="flex items-center gap-2 text-fg/75">
        <span aria-hidden="true" className="text-lg leading-none font-light">
          \/\/
        </span>
        <span className="h-6 w-px bg-line-strong" aria-hidden="true" />
        <span className="flex flex-col text-[11px] leading-[1.15] font-semibold tracking-[0.12em]">
          <span>WALTHER</span>
          <span>KRANZ</span>
        </span>
      </span>
    );
  }

  if (logo.kind === "stacked") {
    return (
      <span className="flex flex-col text-[13px] leading-[0.95] font-bold tracking-[0.06em] text-fg/75">
        <span>MO</span>
        <span>RE</span>
      </span>
    );
  }

  return (
    <span className="text-[15px] font-semibold tracking-[0.08em] text-fg/75">
      GIS
    </span>
  );
}

export function LogoMarquee() {
  // Şeridi iki kez basıyoruz; animasyon -%50 kaydırınca dikiş görünmez.
  const track = [...logos, ...logos, ...logos, ...logos];

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
                <LogoMark logo={logo} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
