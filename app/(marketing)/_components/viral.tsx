import { ArrowUpRightIcon, PlusIcon } from "./icons";
import Image from "next/image";
import { PolaroidPlaceholder } from "./media-placeholder";
import { ButtonLink, Container } from "./ui";

export function Viral() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-28">
      <Container className="relative">
        {/* Başlık — "#KusursuzAkış" etiketi ilk satırın sonuna oturuyor.
            İki span lg'de ayrı satır oluyor, altında normal akışta sarıyor. */}
        <div className="relative">
          <h2 className="mx-auto max-w-[880px] text-center text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.12] font-bold tracking-[-0.025em]">
            <span className="lg:block">
              Sıkıcı Bekleyişleri{" "}
              <span className="ml-1 inline-block -rotate-[1.5deg] rounded-[3px] bg-white px-3 py-1 align-middle text-[clamp(0.8rem,1.35vw,1.1rem)] font-semibold tracking-normal text-ink">
                #KusursuzAkış
              </span>
            </span>{" "}
            <span className="lg:block">Viral Etkileşime Çevirin</span>
          </h2>

          <PolaroidPlaceholder
            label="Çift"
            src="/gorseller/kare-cift.webp"
            aria-hidden="true"
            className="absolute -top-8 right-0 hidden w-[110px] rotate-[7deg] xl:block"
          />
          <PolaroidPlaceholder
            label="Foto"
            src="/gorseller/kare-masa.webp"
            aria-hidden="true"
            className="absolute top-[105px] left-0 hidden w-[46px] -rotate-[9deg] xl:block"
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5">
          {/* 1 — QR ile katılım */}
          <div className="flex flex-col">
            <Image
              src="/gorseller/qr-okutan-telefon.webp"
              alt="Masadaki QR kodu okutan telefon"
              width={1200}
              height={655}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-[300px] w-full rounded-[14px] object-cover lg:h-[365px]"
            />
            <div className="mt-6 flex items-start gap-4">
              <PlusIcon className="mt-0.5 size-6 text-fg/45" />
              <p className="max-w-[300px] text-[13px] leading-[1.6] text-fg-muted">
                Uygulama indirmek yok. Misafirler masadaki QR kodu okutarak saniyeler
                içinde şova doğrudan dahil olur.
              </p>
            </div>
          </div>

          {/* 2 — Dokulu marka kartı.
              Arka plan artık kartı tam kaplayan, sessiz dönen metalik doku
              videosu. Üstüne koyu bir perde çekiliyor: doku hareketli ve
              parlak, metin okunurluğu perdeye bağlı.

              `autoPlay muted loop playsInline` dördü BİRLİKTE şart — iOS
              sessiz olmayan videoyu satır içi oynatmıyor, `playsInline`
              olmadan tam ekrana geçiriyor.

              `preload="metadata"`: 900 KB'lık dosya sayfa açılışını
              bekletmesin (mekan interneti mantığı burada da geçerli).
              `poster` ilk kareyi anında gösteriyor, video sonra devralıyor. */}
          <div className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface p-8 lg:min-h-[490px]">
            <video
              aria-hidden="true"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/gorseller/doku-poster.webp"
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-45"
            >
              <source src="/gorseller/doku-loop.mp4" type="video/mp4" />
            </video>
            {/* Okunurluk perdesi — metin dokunun parlak yerlerinde kaybolmasın */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70"
            />

            <p className="relative text-[22px] leading-none font-extrabold tracking-[0.14em]">
              MIXO
            </p>

            {/* mt-auto ikilisi: başlık bloğu kartın ortasına, imza en alta */}
            <div className="relative mt-auto pt-16">
              <h3 className="max-w-[230px] text-[19px] leading-[1.3] font-semibold tracking-tight">
                Yapay Zeka ile Kişiselleştirilmiş Görevler
              </h3>
              <hr className="mt-5 max-w-[120px] border-line-strong" />

              <p className="mt-6 max-w-[260px] text-[13px] leading-[1.65] text-fg-muted">
                AI, her misafire konseptin ruhuna uygun, masadaki enerjiyi tavan
                yaptıran gizli ve eğlenceli fotoğraf görevleri verir.
              </p>
            </div>

            <p className="relative mt-auto pt-10 text-[12px] text-fg-muted">
              Work with <span className="font-semibold text-fg">Mixo Creative</span>
            </p>
          </div>

          {/* 3 — Sahne görseli + kapanış CTA */}
          <div className="flex flex-col">
            <Image
              src="/gorseller/dev-ekran-mozaik.webp"
              alt="Dev ekranda canlı mozaik"
              width={1200}
              height={655}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-[300px] w-full rounded-[14px] object-cover lg:h-[365px]"
            />
            <div className="mt-6 flex lg:justify-end">
              <ButtonLink href="/etkinlik-olustur" variant="dark" size="md">
                Etkinliği Yarat
                <ArrowUpRightIcon className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
