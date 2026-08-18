import { ArrowRightIcon, PlusIcon } from "./icons";
import Image from "next/image";
import { PolaroidPlaceholder } from "./media-placeholder";
import { ButtonLink, Container } from "./ui";

/**
 * `lift` değerleri tasarımdaki zikzak dizilimden ölçüldü (0 / +160 / +80 /
 * +144 px). Sadece lg ve üstünde uygulanıyor; altında kartlar düz akıyor.
 */
const features = [
  {
    tag: "Özelleştirme",
    title: "Gecenizin Kimliğini Yansıtın",
    body: "Sistemi tamamen kendi konseptinize göre tasarlayın. Düğün, lansman veya partinize özel renkler, logolar ve karşılama ekranları oluşturarak benzersiz bir atmosfer yaratın.",
    media: "Tablet / karşılama ekranı",
    src: "/gorseller/karsilama-ekrani.webp",
    lift: "lg:mt-0",
  },
  {
    tag: "Canlı Moderasyon",
    title: "Kontrol Daima Sizde",
    body: "Dev ekrana yansıyacak tüm fotoğrafları akıllı yapay zeka filtreleriyle güvende tutun veya tek tıkla kendi cep telefonunuzdan onaylayarak sahneye gönderin.",
    media: "Telefonda moderasyon",
    src: "/gorseller/telefonda-moderasyon.webp",
    lift: "lg:mt-40",
  },
  {
    tag: "Premium Deneyim",
    title: "Geleceğin Eğlence Anlayışı",
    body: "Sıradan fotoğraf kabinlerini (photobooth) unutun. Masalardan ana sahneye uzanan dijital ve interaktif bir köprü kurarak misafirlerinizi gecenin yıldızı yapın.",
    media: "Misafirler / kutlama",
    src: "/gorseller/misafirler-kutlama.webp",
    lift: "lg:mt-20",
  },
  {
    tag: "Dijital Arşiv",
    title: "Anılar Sonsuza Dek Sizinle",
    body: "Etkinlik sonrasında çekilen yüzlerce fotoğraf, yüksek çözünürlüklü dev bir galeri olarak size teslim edilir. Gecenin en güzel anlarını tek tıkla indirin ve saklayın.",
    media: "Galeri / baskılar",
    src: "/gorseller/galeri-baskilar.webp",
    lift: "lg:mt-36",
  },
] as const;

export function Features() {
  return (
    <section id="vizyonumuz" className="relative overflow-hidden py-24 lg:py-28">
      <Container className="relative">
        {/* Üst blok: solda başlık + buton, sağda açıklama */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="max-w-[460px] text-[clamp(2rem,4vw,3.35rem)] leading-[1.06] font-bold tracking-[-0.025em]">
              Her Etkinlikte Kusursuz Kontrol
            </h2>
            <ButtonLink
              href="#paketler"
              variant="solid"
              size="md"
              className="mt-8"
            >
              Tüm Özellikleri İncele
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>

          {/* pt: tasarımda sağ blok sol başlıktan ~170px aşağıda başlıyor,
              savruk polaroid'e de bu boşluk yer açıyor. */}
          <div className="relative lg:pt-24">
            <PolaroidPlaceholder
              label="Sahne"
              src="/gorseller/kare-festival.webp"
              aria-hidden="true"
              className="absolute -top-6 left-12 hidden w-[76px] rotate-[8deg] lg:block"
            />
            <p className="text-[clamp(1.25rem,2vw,1.7rem)] leading-[1.32] font-normal tracking-[-0.01em]">
              Arka planda çalışan güçlü otonom sistem sayesinde etkinlik sırasındaki
              tüm stresi unutun
            </p>
            <p className="mt-6 max-w-[470px] text-[13px] leading-[1.65] text-fg-muted">
              İster büyük bir organizasyon şirketi olun, ister kendi özel gecenizi
              tasarlayın; misafirlerinize yıllarca konuşulacak bir şov sunun.
            </p>
          </div>
        </div>

        {/* Zikzak kart dizilimi */}
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-4 lg:grid-cols-4 lg:items-start lg:gap-5">
          {features.map(({ tag, title, body, media, src, lift }) => (
            <li
              key={title}
              className={`flex flex-col overflow-hidden rounded-panel border border-line bg-surface p-3 ${lift}`}
            >
              <div className="relative">
                <Image
                  src={src}
                  alt={media}
                  width={900}
                  height={491}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-56 w-full rounded-[14px] object-cover"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-ink">
                  {tag}
                </span>
              </div>

              <div className="flex flex-1 flex-col px-2 pt-6 pb-3">
                <PlusIcon className="size-5 text-fg/45" />
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2.5 text-[12px] leading-[1.6] text-fg-muted">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
