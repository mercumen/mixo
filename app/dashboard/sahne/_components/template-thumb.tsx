/**
 * Şablon küçük resimleri.
 *
 * Bunlar fotoğraf değil, düzenin şemasını anlatan diyagramlar — tasarımda da
 * öyle. Bu yüzden yer tutucu değil, gerçekten çizildiler; koyu zemin sahneyi
 * (TV ekranını) temsil ediyor, panel açık temada olsa bile.
 */

import Image from "next/image";

const frame =
  "relative h-full w-full overflow-hidden rounded-lg bg-[#0d0b14] " +
  "bg-[radial-gradient(70%_60%_at_50%_0%,rgba(124,58,237,0.28),transparent_70%)]";

const box = "rounded-[2px] border border-white/25 bg-white/5";

export function TemplateThumb({ id }: { id: string }) {
  switch (id) {
    /**
     * ANI BAHÇESİ — diğerleri gibi diyagram değil, SAHNENİN GERÇEK RENDER'I.
     *
     * Diğer şablonlar henüz kod olarak yok; onları diyagramla anlatmak
     * doğru. Anı Bahçesi ise çalışıyor (app/display), o yüzden organizatöre
     * şemasını değil gerçekten göreceği şeyi gösteriyoruz — görüntü
     * ekranın kendisinden alındı.
     */
    case "ani-bahcesi":
      return (
        <div className={frame}>
          <Image
            src="/gorseller/sahne-ani-bahcesi.webp"
            alt="Anı Bahçesi sahnesi: fotoğrafların yaprak olduğu cam gül"
            width={640}
            height={441}
            sizes="320px"
            className="size-full object-cover"
          />
        </div>
      );

    case "organik-kolaj":
      return (
        <div className={frame}>
          <div className="absolute inset-3 grid grid-cols-5 grid-rows-4 gap-1.5">
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-3`} />
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-4`} />
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-1`} />
            <div className={`${box} col-span-1 row-span-2`} />
            <div className={`${box} col-span-1 row-span-1`} />
          </div>
        </div>
      );

    case "foto-bulutu":
      return (
        <div className={frame}>
          {[
            "left-[12%] top-[18%] w-[22%] h-[34%] -rotate-12",
            "left-[38%] top-[10%] w-[24%] h-[36%] rotate-6",
            "left-[64%] top-[22%] w-[20%] h-[30%] -rotate-6",
            "left-[24%] top-[52%] w-[22%] h-[32%] rotate-9",
            "left-[54%] top-[56%] w-[24%] h-[30%] -rotate-8",
          ].map((pos) => (
            <div key={pos} className={`absolute ${box} ${pos}`} />
          ))}
        </div>
      );

    case "mozaik-portre":
      // Küçük karolar birleşip bir siluet oluşturuyor
      return (
        <div className={frame}>
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid grid-cols-12 gap-[2px]">
              {Array.from({ length: 84 }, (_, i) => {
                const col = i % 12;
                const row = Math.floor(i / 12);
                // Kaba bir kubbe şekli
                const inShape =
                  row >= 2 || (col > 2 && col < 9 && row >= 1) || (col > 4 && col < 7);
                return (
                  <span
                    key={i}
                    className={`size-[5px] rounded-[1px] ${
                      inShape ? "bg-violet-400/80" : "bg-white/5"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      );

    case "spotlight":
      return (
        <div className={frame}>
          <div className="absolute inset-3 flex gap-1.5">
            <div className="flex-1 rounded-[3px] border border-white/30 bg-gradient-to-br from-violet-500/40 to-fuchsia-500/20" />
            <div className="flex w-[22%] flex-col gap-1.5">
              <div className={`${box} flex-1`} />
              <div className={`${box} flex-1`} />
            </div>
          </div>
        </div>
      );

    case "polaroid-yigini":
      return (
        <div className={frame}>
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative h-[62%] w-[42%]">
              <div className="absolute inset-0 -rotate-12 rounded-[3px] bg-white/70" />
              <div className="absolute inset-0 -rotate-6 rounded-[3px] bg-white/85" />
              <div className="absolute inset-0 rotate-2 rounded-[3px] bg-white p-1 pb-3">
                <div className="size-full rounded-[2px] bg-gradient-to-br from-violet-400 to-fuchsia-300" />
              </div>
            </div>
          </div>
        </div>
      );

    case "3d-karusel":
      return (
        <div className={frame}>
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-3">
            <div className={`${box} h-[42%] w-[16%]`} />
            <div className={`${box} h-[56%] w-[19%]`} />
            <div className="h-[72%] w-[22%] rounded-[3px] border border-white/45 bg-gradient-to-br from-violet-400/60 to-fuchsia-400/30" />
            <div className={`${box} h-[56%] w-[19%]`} />
            <div className={`${box} h-[42%] w-[16%]`} />
          </div>
        </div>
      );

    case "zaman-tuneli":
      return (
        <div className={frame}>
          <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/20" />
          <div className="absolute inset-0 flex items-center justify-center gap-6">
            <div className={`${box} size-[26%] -translate-y-[38%]`} />
            <div className="size-[26%] translate-y-[38%] rounded-[2px] border border-violet-300/50 bg-violet-400/25" />
            <div className={`${box} size-[26%] -translate-y-[38%]`} />
          </div>
        </div>
      );

    default:
      return <div className={frame} />;
  }
}
