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
          {/* Etiket başlığın İÇİNDEN çıkarıldı: yeni başlık tam bir cümle ve
              araya hashtag sıkıştırmak cümleyi bölüyordu. Üst satırda duruyor,
              tasarımdaki döndürülmüş beyaz rozet görünümü korundu. */}
          <p className="flex justify-center">
            <span className="inline-block -rotate-[1.5deg] rounded-[3px] bg-white px-3 py-1 text-[clamp(0.8rem,1.35vw,1.1rem)] font-semibold text-ink">
              #KusursuzAkış
            </span>
          </p>

          <h2 className="mx-auto mt-6 max-w-[880px] text-center text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.12] font-bold tracking-[-0.025em]">
            Etkinliğinizin Gerçek Potansiyelini Ortaya Çıkarın
          </h2>

          <p className="mx-auto mt-6 max-w-[680px] text-center text-[14px] leading-[1.7] text-fg-muted">
            MIXOinteractive, katılımcıları deneyimin aktif bir parçası haline
            getirerek etkinliğinizin yarattığı değeri artırır. Daha yüksek
            etkileşim, daha güçlü marka deneyimi ve ölçülebilir sonuçlar elde
            etmenizi sağlar.
          </p>

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

        {/* Dört değer maddesi.
            Üç fotoğraf kartının İÇİNE konmadılar: o kartlar görsel + tek mesaj
            taşıyor, bunlar başlık + tek cümlelik dört kısa blok. Ayrı bir satır
            olarak, ince ayırıcılarla dizildiler. */}
        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Aktif Katılım",
              body: "Katılımcıları pasif izleyicilerden deneyimin aktif bir parçasına dönüştürün.",
            },
            {
              title: "Değer Üreten İçerikler",
              body: "Katılımcılar tarafından oluşturulan içerikleri markanız için yeniden kullanılabilir pazarlama varlıklarına dönüştürün.",
            },
            {
              title: "Ölçülebilir İçgörüler",
              body: "Katılım, etkileşim ve içerik performansını analiz ederek gelecekte daha doğru kararlar alın.",
            },
            {
              title: "Kalıcı Marka Deneyimi",
              body: "Etkinliğiniz sona erdikten sonra da etkisini sürdüren deneyimler oluşturun.",
            },
          ].map(({ title, body }) => (
            <li key={title} className="border-t border-line pt-5">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                {title}
              </h3>
              <p className="mt-2.5 text-[13px] leading-[1.65] text-fg-muted">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
