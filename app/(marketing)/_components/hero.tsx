import { ArrowRightIcon } from "./icons";
import { LogoMarquee } from "./logo-marquee";
import { PolaroidPlaceholder } from "./media-placeholder";
import { ButtonLink, Container } from "./ui";

/**
 * Hero'nun altındaki 4 metrik kartı. Tasarımda soldan sağa hem zemin moru
 * artıyor hem de kartlar hafifçe yukarı kayıyor (~5-13px). Kayma sadece
 * lg ve üstünde; altında düz grid.
 */
const stats = [
  {
    value: "0",
    label: "İndirme. Katılım için ek uygulama gerekmez.",
    tint: "bg-tint-steel",
    lift: "lg:mt-0",
  },
  {
    value: "10sn",
    label: "Kurulum süresi. Hızla başlar, süreci yavaşlatmaz.",
    tint: "bg-tint-slate",
    lift: "lg:mt-0",
  },
  {
    value: "Canlı Etkileşim",
    label: "Katılımcı ilgisini etkinlik boyunca aktif tutar.",
    tint: "bg-tint-plum",
    lift: "lg:-mt-2",
  },
  {
    value: "Etkinlik Analizi",
    label: "Katılım, içerik ve etkileşim performansını tek raporda görüntüleyin.",
    tint: "bg-tint-violet",
    lift: "lg:-mt-3",
  },
] as const;

export function Hero() {
  return (
    <section id="nasil-calisir" className="relative overflow-hidden">
      {/* Işıma burada değil: header'ın da arkasını kaplaması gerektiği için
          layout.tsx'e taşındı. */}

      {/* Savrulmuş polaroid'ler. Tasarımda hero'nun sağ yarısına dağılmış;
          küçük ekranda yer kalmadığı için gizli. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        {/* Konumlar sağ kenara göre verildi — başlık kaç satır olursa olsun
            metnin üstüne binmesinler. */}
        <PolaroidPlaceholder
          label="Kalabalık / sahne"
          className="absolute top-[150px] right-[36%] w-[105px] rotate-[9deg]"
        />
        <PolaroidPlaceholder
          label="Kalabalık"
          className="absolute top-[210px] right-[-30px] w-[135px] -rotate-[7deg]"
        />
        <PolaroidPlaceholder
          label="Misafirler"
          className="absolute top-[610px] right-[110px] w-[52px] rotate-[12deg] opacity-70"
        />
        <PolaroidPlaceholder
          label="Dans"
          className="absolute top-[715px] right-[57%] w-[72px] -rotate-[11deg]"
        />
      </div>

      <Container className="relative pt-20 pb-16 lg:pt-28 lg:pb-20">
        <h1 className="max-w-[620px] text-[clamp(2.15rem,4.4vw,3.45rem)] leading-[1.09] font-normal tracking-[-0.02em] text-balance">
          Etkinliklerinizi Ölçülebilir ve Etkileşimli Unutulmaz Deneyimlere
          Dönüştürün
        </h1>

        <p className="mt-6 max-w-[535px] text-[15px] leading-[1.65] text-fg-muted">
          MIXOinteractive, katılımcı etkileşimini artıran, kullanıcı içeriklerini
          yapay zekâ ile canlı dijital sanat deneyimlerine dönüştüren ve etkinlik
          performansını anlamlı içgörülerle analiz eden yeni nesil Event
          Intelligence platformudur.
        </p>

        {/* CTA + yanındaki üst üste binmiş küçük kareler ve açıklama */}
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-6">
          <ButtonLink href="/etkinlik-olustur" variant="dark" size="lg">
            Etkinliği Yarat
            <span className="ml-4 grid size-[42px] place-items-center rounded-full bg-white text-ink">
              <ArrowRightIcon className="size-[18px]" />
            </span>
          </ButtonLink>

          <div className="flex items-center gap-4">
            <div aria-hidden="true" className="flex items-center">
              <PolaroidPlaceholder
                label="Foto"
                className="w-[46px] -rotate-[10deg]"
              />
              <PolaroidPlaceholder
                label="Foto"
                className="-ml-4 w-[46px] rotate-[3deg]"
              />
              <PolaroidPlaceholder
                label="Foto"
                className="-ml-4 w-[46px] rotate-[13deg]"
              />
            </div>
            <p className="max-w-[175px] text-[13px] leading-[1.45] text-fg-muted">
              Etkinliğin Enerjisini Sahneye Taşıyan Teknoloji
            </p>
          </div>
        </div>

        {/* Metrik kartları */}
        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          {stats.map(({ value, label, tint, lift }) => (
            <li
              key={value}
              className={`flex min-h-[145px] flex-col justify-between rounded-card border border-line p-6 ${tint} ${lift}`}
            >
              <p
                className={`font-medium tracking-tight ${
                  // Sayısal değerler iri, metin değerler bir kademe küçük
                  value.length <= 5 ? "text-[34px] leading-none" : "text-[21px] leading-tight"
                }`}
              >
                {value}
              </p>
              <p className="mt-5 text-[13px] leading-[1.5] text-fg-muted">{label}</p>
            </li>
          ))}
        </ul>

        {/* Referans logoları — tasarımda sağa yaslı */}
        <div className="mt-14 flex flex-col gap-5 lg:items-end">
          <p className="text-[13px] font-medium text-fg-muted">
            Öncü Organizasyon ve PR Ajanslarının Tercihi
          </p>
          <LogoMarquee />
        </div>
      </Container>
    </section>
  );
}
