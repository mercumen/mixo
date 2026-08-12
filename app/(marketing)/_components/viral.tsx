import { ArrowUpRightIcon, PlusIcon } from "./icons";
import { MediaPlaceholder, PolaroidPlaceholder } from "./media-placeholder";
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
            aria-hidden="true"
            className="absolute -top-8 right-0 hidden w-[110px] rotate-[7deg] xl:block"
          />
          <PolaroidPlaceholder
            label="Foto"
            aria-hidden="true"
            className="absolute top-[105px] left-0 hidden w-[46px] -rotate-[9deg] xl:block"
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5">
          {/* 1 — QR ile katılım */}
          <div className="flex flex-col">
            <MediaPlaceholder
              label="Masadaki QR kodu okutan telefon"
              className="h-[300px] w-full lg:h-[365px]"
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
              Arka plan dokusu MediaPlaceholder değil: tam kaplayan bir kutunun
              ortalanmış etiketi kart metniyle çakışıyordu. Doku burada düz bir
              katman, "hangi görsel gelecek" bilgisi sağ alta iğnelendi. */}
          <div className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface p-8 lg:min-h-[490px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 10px)",
              }}
            />
            <span
              aria-hidden="true"
              className="absolute right-3 bottom-3 text-[9px] tracking-wide text-fg-subtle uppercase"
            >
              Dokulu arka plan gelecek
            </span>

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
            <MediaPlaceholder
              label="Dev ekranda canlı mozaik"
              className="h-[300px] w-full lg:h-[365px]"
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
