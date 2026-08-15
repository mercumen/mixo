import { Wordmark } from "@/app/_components/wordmark";

/**
 * Masa kartı — basılacak asıl şey.
 *
 * TASARIM NOTU: modal'daki önizleme ~150px'lik bir küçük resimdi, içindeki
 * metinler okunmuyordu. Bu düzen mevcut görsel dilden türetildi; gerçek
 * tasarım gelince burası değişecek, çağıran taraf değişmez.
 *
 * KVKK: CLAUDE.md aydınlatma metninin masa kartında olmasını istiyordu. Tek
 * QR'a geçince kart kalmamıştı ve metni uygulamaya taşımıştık — basılabilir
 * kart geri geldiği için kısa bilgilendirme buraya da kondu. Uygulamadaki
 * açık rıza ekranı YERİNDE KALIYOR: kartı herkes okumuyor, rıza kaydı
 * session'a yazılmak zorunda.
 *
 * QR ortasındaki logo, kodun bir kısmını kapatıyor — bu yüzden kod en yüksek
 * hata düzeltme seviyesiyle (H) üretiliyor (bkz. lib/qr.ts).
 */
export function TableCard({
  eventName,
  code,
  shortUrl,
  qrDataUrl,
}: {
  eventName: string;
  code: string;
  /** Kartta yazılı görünen, elle yazılabilir kısa adres */
  shortUrl: string;
  qrDataUrl: string;
}) {
  return (
    <div className="table-card flex w-[420px] flex-col items-center rounded-2xl border border-neutral-200 bg-white px-10 py-9 text-center text-neutral-900">
      <div className="text-neutral-900">
        <Wordmark size="sm" />
      </div>

      <p className="mt-7 font-serif text-[22px] leading-tight text-neutral-800">
        {eventName}
      </p>

      <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
        Kareyi okut, fotoğrafını çek — anında dev ekranda
      </p>

      {/* QR + ortada logo. Beyaz pad kodun okunmasını kolaylaştırıyor. */}
      <div className="relative mt-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL,
            next/image optimizasyonuna gerek yok ve baskıda birebir istiyoruz */}
        <img
          src={qrDataUrl}
          alt={`${eventName} etkinliği için QR kodu`}
          className="size-[230px]"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="rounded-md bg-white px-2 py-1 text-[11px] font-extrabold tracking-[0.14em] text-neutral-900">
            MIXO
          </span>
        </span>
      </div>

      {/* QR okunmayan telefon her etkinlikte çıkıyor (CLAUDE.md saha kısıtı) */}
      <div className="mt-6 w-full rounded-xl bg-neutral-100 px-4 py-3">
        <p className="text-[11px] text-neutral-500">Karekod okunmuyorsa</p>
        <p className="mt-0.5 text-[13px] font-semibold text-neutral-900">
          {shortUrl}
        </p>
        <p className="mt-1.5 text-[11px] text-neutral-500">
          Etkinlik kodu:{" "}
          <span className="font-mono text-[13px] font-semibold tracking-widest text-neutral-900">
            {code}
          </span>
        </p>
      </div>

      <p className="mt-5 text-[9.5px] leading-relaxed text-neutral-400">
        Çekilen fotoğraflar etkinlik ekranında gösterilir ve etkinlik sonrası
        30 gün içinde silinir. Ayrıntılı aydınlatma metni katılım ekranındadır.
      </p>
    </div>
  );
}
