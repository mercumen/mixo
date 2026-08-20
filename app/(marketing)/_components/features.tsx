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
    tag: "1. Adım",
    title: "Etkinlik Yapılandırılır",
    body: "Etkinlik bilgileri, marka kimliği ve deneyim kurgusu oluşturulur. Yapay zekâ, etkinliğin konseptine uygun görevler üretir; dilerseniz bu görevleri özelleştirebilir veya kendi görevlerinizi ekleyebilirsiniz.",
    media: "Tablet / karşılama ekranı",
    src: "/gorseller/karsilama-ekrani.webp",
    lift: "lg:mt-0",
  },
  {
    tag: "2. Adım",
    title: "Katılımcılar Deneyime Dahil Olur",
    body: "Katılımcılar QR kod ile uygulama indirmeden saniyeler içinde etkinliğe katılır. Yapay zekâ tarafından oluşturulan görev akışıyla deneyimin aktif bir parçası haline gelir.",
    media: "Misafirler / kutlama",
    src: "/gorseller/misafirler-kutlama.webp",
    lift: "lg:mt-40",
  },
  {
    tag: "3. Adım",
    title: "Etkileşim ve İçerik Üretilir",
    body: "Katılımcılar görevleri tamamlayarak fotoğraf ve içerik üretir. Tüm içerikler gerçek zamanlı olarak tek platformda toplanır ve etkinliğin dijital deneyimini besler.",
    media: "Telefonda moderasyon",
    src: "/gorseller/telefonda-moderasyon.webp",
    lift: "lg:mt-20",
  },
  {
    /**
     * 4. ADIM METNİ BENİM YAZDIĞIM — onay bekliyor.
     *
     * Gönderilen metinde üç adım vardı ama bu bölümde dört fotoğraf kutusu
     * var ve bölümün giriş paragrafı "etkinlik öncesinden etkinlik sonrasına
     * kadar" diyor. Üç adımda bırakmak hem bir kutuyu boş bırakır hem de
     * girişin verdiği sözü tutmazdı. Metin değiştirilecekse tek yer burası.
     */
    tag: "4. Adım",
    title: "Sonuçlar Ölçülür ve Arşivlenir",
    body: "Etkinlik sonrasında katılım, etkileşim ve içerik performansı raporlanır. Üretilen tüm içerikler yüksek çözünürlüklü dijital arşiv olarak teslim edilir ve markanız için yeniden kullanılabilir hale gelir.",
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
              MIXOinteractive Nasıl Çalışır?
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
              MIXOinteractive, yapay zekâ destekli iş akışıyla katılımcı deneyimini
              uçtan uca yönetir
            </p>
            <p className="mt-6 max-w-[470px] text-[13px] leading-[1.65] text-fg-muted">
              Etkinlik öncesinden etkinlik sonrasına kadar tüm süreç tek bir platform
              üzerinden planlanır, yönetilir ve ölçülür.
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
