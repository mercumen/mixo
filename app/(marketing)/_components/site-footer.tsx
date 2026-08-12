import Link from "next/link";
import { Wordmark } from "@/app/_components/wordmark";
import { Container } from "./ui";

/**
 * Pazarlama sitesi footer'ı.
 *
 * Yapı: içeriği taşıyan koyu kart + altında ince bir yasal şerit.
 *
 * NOT — hukuki bağlantılar yer tutucu: KVKK Aydınlatma Metni, Gizlilik
 * Politikası ve Çerez Politikaları gerçek sayfa olmak zorunda (500 kişinin
 * tanınabilir fotoğrafını işleyen bir üründe bu opsiyonel değil). Sayfalar
 * yazılana kadar `#` duruyor, docs/YAPILACAKLAR.md'ye not düşüldü.
 */

const exploreLinks = [
  { label: "Nasıl Çalışır?", href: "#nasil-calisir" },
  { label: "Paketler ve Fiyatlar", href: "#paketler" },
  { label: "Referans Etkinlikler", href: "#referanslar" },
];

const socialLinks = [
  { label: "Instagram", href: "#instagram" },
  { label: "LinkedIn", href: "#linkedin" },
  { label: "Bize Ulaşın", href: "#iletisim" },
];

const legalLinks = [
  { label: "KVKK Aydınlatma Metni", href: "#kvkk" },
  { label: "Gizlilik Politikası", href: "#gizlilik" },
  { label: "Çerez Politikaları", href: "#cerez" },
];

const contact = {
  address:
    "Yeşilköy Mah. Havaalanı Cad. Atatürk Havalimanı Dış Hatlar, 34149, Istanbul, Turkey",
  email: "info@mixo.com.tr",
  phone: "+90 (541) 932 82 58",
};

const linkClass =
  "text-[12px] text-fg-muted transition-colors duration-200 hover:text-fg";

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className={linkClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative pt-10 pb-8">
      <Container>
        <div className="rounded-panel border border-line bg-surface/70 p-8 sm:p-10">
          {/* Üst blok: marka + iki bağlantı kolonu */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
            <div>
              <Wordmark size="md" />
              <p className="mt-5 max-w-[340px] text-[11.5px] leading-[1.7] text-fg-muted">
                MIXOinteractive, katılımcı etkileşimini artıran, kullanıcı
                içeriklerini yapay zekâ ile canlı dijital sanat deneyimlerine
                dönüştüren ve etkinlik performansını anlamlı içgörülerle analiz
                eden yeni nesil Event Intelligence platformudur.
              </p>
            </div>

            <LinkColumn title="Keşfedin" links={exploreLinks} />
            <LinkColumn title="Sosyal Ağlar" links={socialLinks} />
          </div>

          {/* İletişim: adres / e-posta / telefon, üstteki kolonlarla hizalı */}
          <div className="mt-12">
            <h3 className="text-[13px] font-semibold tracking-tight">
              İletişim
            </h3>
            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
              <address className="max-w-[280px] text-[11.5px] leading-[1.7] text-fg-muted not-italic">
                {contact.address}
              </address>
              <a
                href={`mailto:${contact.email}`}
                className={`${linkClass} lg:pt-px`}
              >
                {contact.email}
              </a>
              <a
                // tel: bağlantısında boşluk/parantez olmaz, temizliyoruz
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className={`${linkClass} lg:pt-px`}
              >
                {contact.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Yasal şerit — kartın dışında */}
        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 px-2 sm:flex-row">
          <p className="text-[11px] text-fg-subtle">
            © {new Date().getFullYear()} MIXOinteractive. Tüm hakları saklıdır.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {legalLinks.map(({ label, href }, i) => (
              <li key={href} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-fg-subtle/50">
                    |
                  </span>
                ) : null}
                <Link
                  href={href}
                  className="text-[11px] text-fg-subtle transition-colors duration-200 hover:text-fg-muted"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
