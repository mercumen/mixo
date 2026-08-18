import { featureIcons, PlanGlyphIcon, type FeatureIconName } from "./icons";
import Image from "next/image";
import { ButtonLink, Container, Pill } from "./ui";

type Plan = {
  name: string;
  /** Açıklamanın kalın başlayan kısmı (Professional'da var). */
  descriptionLead?: string;
  description: string;
  price: string;
  priceSuffix: string;
  cta: string;
  ctaVariant: "solid" | "dark";
  featured?: boolean;
  /** "Essential'daki tüm özelliklere ek olarak" gibi üst etiket. */
  featuresLead?: string;
  features: { label: string; icon: FeatureIconName }[];
  /** Kart zemini + hizalama sınıfları */
  tint: string;
  lift: string;
};

const plans: Plan[] = [
  {
    name: "Essential",
    description: "Etkileşimli etkinlik deneyimine hızlı ve kolay başlangıç.",
    price: "İletişime Geçin",
    priceSuffix: "/ etkinlik",
    cta: "Bu planı seç",
    ctaVariant: "dark",
    tint: "bg-tint-steel",
    lift: "lg:mt-4",
    features: [
      { label: "QR ile Katılım", icon: "user" },
      { label: "Manuel Görev Oluşturma", icon: "list" },
      { label: "Fotoğraf Yükleme", icon: "photo" },
      { label: "Canlı Mozaik", icon: "photo" },
      { label: "Etkinlik Analizi", icon: "photo" },
      { label: "Dijital Galeri", icon: "photo" },
      { label: "Standart Destek", icon: "photo" },
    ],
  },
  {
    name: "Professional",
    descriptionLead: "Yapay zekâ destekli",
    description: " katılımcı deneyimi ve gelişmiş etkinlik yönetimi.",
    price: "İletişime Geçin",
    priceSuffix: "/ etkinlik",
    cta: "Bu planı seç",
    ctaVariant: "solid",
    featured: true,
    tint: "bg-tint-violet",
    lift: "lg:mt-0",
    featuresLead: "Essential'daki tüm özelliklere ek olarak",
    features: [
      { label: "Kişiselleştirilmiş Yapay Zekâ Görevleri", icon: "user" },
      { label: "Yapay Zeka İçerik Moderasyonu", icon: "list" },
      { label: "Canlı Görsel Deneyimler", icon: "photo" },
      { label: "Gelişmiş Etkinlik Analizi", icon: "photo" },
      { label: "Markaya Özel Deneyim", icon: "photo" },
      { label: "Öncelikli Destek", icon: "photo" },
      { label: "Genişletilmiş Dijital Arşiv", icon: "photo" },
    ],
  },
  {
    name: "Enterprise",
    description: "Büyük ölçekli ve kurumsal projeler için özelleştirilebilir çözüm.",
    price: "Teklif alın",
    priceSuffix: "/ etkinlik",
    cta: "Bize ulaşın",
    ctaVariant: "dark",
    tint: "bg-tint-slate",
    lift: "lg:mt-7",
    featuresLead: "Professional'daki tüm özelliklere ek olarak",
    features: [
      { label: "White Label", icon: "user" },
      { label: "Tamamen Özelleştirilebilir Görsel Deneyimler", icon: "list" },
      { label: "Özel Tasarım Desteği", icon: "photo" },
      { label: "Kuruma Özel Geliştirmeler", icon: "photo" },
      { label: "Öncelikli Teknik Destek", icon: "photo" },
    ],
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-panel border p-6 ${plan.tint} ${plan.lift} ${
        plan.featured ? "border-violet/35 lg:pb-8" : "border-line"
      }`}
    >
      {plan.featured ? (
        <div
          aria-hidden="true"
          className="glow-card pointer-events-none absolute inset-0"
        />
      ) : null}

      {plan.featured ? (
        <span className="absolute top-6 right-6 z-10 rounded-full border border-line-strong bg-ink/70 px-3.5 py-1.5 text-[12px] font-medium backdrop-blur-sm">
          En popüler
        </span>
      ) : null}

      {/* Üst satır: plan amblemi + tasarımdaki 3D dekor */}
      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`grid size-14 place-items-center rounded-full border ${
            plan.featured
              ? "border-violet/45 bg-violet/25 text-white"
              : "border-line-strong bg-white/6 text-fg/70"
          }`}
        >
          <PlanGlyphIcon className="size-7" />
        </span>
        {/* Dekoratif metalik doku — kartın sağ üst köşesindeki soğuk vurgu.
            `aria-hidden` değil ama alt boş: anlam taşımıyor, süs. */}
        <Image
          src="/gorseller/doku-metalik.webp"
          alt=""
          width={720}
          height={405}
          sizes="144px"
          className="h-20 w-36 shrink-0 rounded-[14px] object-cover opacity-70"
        />
      </div>

      <h3 className="relative mt-7 text-[19px] font-semibold tracking-tight">
        {plan.name}
      </h3>

      <p className="relative mt-2 max-w-[290px] text-[13px] leading-[1.6] text-fg-muted">
        {plan.descriptionLead ? (
          <strong className="font-semibold text-fg">{plan.descriptionLead}</strong>
        ) : null}
        {plan.description}
      </p>

      <p className="relative mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[19px] font-semibold tracking-tight">{plan.price}</span>
        <span className="text-[13px] text-fg-muted">{plan.priceSuffix}</span>
      </p>

      <ButtonLink
        href="#iletisim"
        variant={plan.ctaVariant}
        size="md"
        className="relative mt-5 w-full"
      >
        {plan.cta}
      </ButtonLink>

      <hr className="relative mt-7 border-line" />

      {plan.featuresLead ? (
        <p className="relative mt-5 text-[11px] text-fg-subtle">{plan.featuresLead}</p>
      ) : null}

      <ul
        className={`relative space-y-3.5 ${plan.featuresLead ? "mt-4" : "mt-6"}`}
      >
        {plan.features.map(({ label, icon }) => {
          const Icon = featureIcons[icon];
          return (
            <li key={label} className="flex items-start gap-3">
              <Icon className="mt-px size-[18px] text-fg/55" />
              {/* min-w-0: uzun özellik adı satırı taşırmasın */}
              <span className="min-w-0 text-[13px] leading-[1.45] text-fg/90">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Pricing() {
  // Işıma artık burada değil — sayfa geneli katmanda (bkz. layout.tsx)
  return (
    <section id="paketler" className="relative overflow-hidden py-24 lg:py-32">
      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          <Pill dot className="border-violet/40 bg-violet/15 text-fg">
            Esnek Planlar
          </Pill>
          <h2 className="mt-7 max-w-[760px] text-[clamp(1.9rem,3.6vw,2.65rem)] leading-[1.15] font-bold tracking-[-0.02em]">
            Etkinliğiniz İçin Doğru Planı Seçin
          </h2>
          <p className="mt-4 max-w-[610px] text-[15px] leading-[1.65] text-fg-muted">
            Daha yüksek katılımcı etkileşimi, daha değerli içerikler ve ölçülebilir
            performans için ihtiyacınıza uygun planı seçin.
          </p>
        </div>

        {/* lg altında tek kolon; öne çıkan kart en üste gelmiyor,
            tasarımdaki soldan sağa okuma sırası korunuyor. */}
        <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
