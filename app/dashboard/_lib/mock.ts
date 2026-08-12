/**
 * ============================================================================
 * STUB VERİ — BACKEND YOK.
 * ============================================================================
 *
 * Panelin tamamı bu dosyadan besleniyor. Firestore bağlandığında sayfalar
 * aynı şekilleri bekleyecek; tipleri burada tutmamın sebebi o.
 *
 * CLAUDE.md hatırlatması: gerçek sorgular yazılırken HER sorguda `.limit()`
 * olacak. Özellikle galeri ve canlı akış sayfaları sayfalama isteyecek —
 * buradaki diziler kasten kısa.
 */

export type EventStatus = "taslak" | "canli" | "bitti";

export type EventSummary = {
  id: string;
  name: string;
  typeLabel: string;
  status: EventStatus;
  /** Görüntüleme için hazır string — tarih biçimlendirme backend'le netleşecek */
  dateLabel: string;
  startsAtLabel: string;
  locationLabel: string;
  guestTargetLabel: string;
  setupProgress: number;
  countdown: { days: number; hours: number; minutes: number };
  paid: boolean;
};

export const currentEvent: EventSummary = {
  id: "evt_demo",
  name: "Ayşe & Mehmet Düğünü",
  typeLabel: "Düğün",
  status: "taslak",
  dateLabel: "16 Ağustos 2026",
  startsAtLabel: "14 Kas 2026 • 18:00",
  locationLabel: "İstanbul, Türkiye",
  guestTargetLabel: "250+ misafir hedefi",
  setupProgress: 60,
  countdown: { days: 106, hours: 18, minutes: 7 },
  paid: false,
};

// currentUser buradan kaldırıldı: gerçek kullanıcı oturum çerezinden
// geliyor (lib/auth/session.ts), panel layout'u sidebar'a prop olarak veriyor.

// Kurulum adımları buradan kaldırıldı: gerçek kaynak lib/setup-steps.ts ve
// etkinlik dokümanındaki `completedSteps` alanı.

// --- Görevler --------------------------------------------------------------

export type TaskSource = "ai" | "manuel";

export type Task = {
  id: string;
  label: string;
  source: TaskSource;
  active: boolean;
  completions: number;
};

export const tasks: Task[] = [
  { id: "t1", label: "En çılgın dans pozunu çek!", source: "ai", active: true, completions: 16 },
  { id: "t2", label: "Göz alıcı bir açılış kokteyli anını yakala!", source: "ai", active: true, completions: 12 },
  { id: "t3", label: "Zarif bir masa düzeni oluştur ve fotoğrafla!", source: "manuel", active: true, completions: 5 },
  { id: "t4", label: "Şık bir düğün davetiyesi taslağı hazırla!", source: "ai", active: true, completions: 8 },
  { id: "t5", label: "Sofistike bir gelin buketi kombinasyonu oluştur!", source: "manuel", active: true, completions: 7 },
  { id: "t6", label: "Davetlilerin zarif gülüşlerini yakala!", source: "ai", active: true, completions: 10 },
  { id: "t7", label: "Etkileyici ve davetkâr bir gala anı yarat!", source: "ai", active: true, completions: 9 },
  { id: "t8", label: "Klasik ama modern bir düğün ritüeli görüntüle!", source: "manuel", active: true, completions: 6 },
];

export const pendingAiTasks = [
  "Damadın kravatını çözdüğü anı yakala",
  "Gelinle dedesinin dans ettiği kareyi çek",
  "Masadaki çiçek süslemesiyle yaratıcı bir kare çek",
  "Gece gökyüzü altında bir çift fotoğrafı çek",
  "Misafirlerin en samimi kahkahasını yakala",
];

export const taskEngine = {
  themeLabel: "Düğün Organizasyonu",
  subject: "Düğün Organizasyonu",
  tone: "Zarif — Sofistike ve davetkâr",
};

export const taskStats = {
  total: 8,
  active: 7,
  completions: 210,
  pendingAi: 6,
};

// --- Fotoğraflar (canlı akış + galeri) -------------------------------------

export type Photo = {
  id: string;
  guest: string;
  task: string;
  likes: number;
  /** Yer tutucu kutunun oranı — gerçek görseller gelince kalkacak */
  ratio: "portrait" | "landscape" | "square";
};

export const reviewQueue: Photo[] = [
  { id: "r1", guest: "Ahmet C.", task: "Gelinle dedesinin dans ettiği kareyi çek", likes: 0, ratio: "landscape" },
  { id: "r2", guest: "Can Y.", task: "Masadaki en komik anı yakala", likes: 0, ratio: "landscape" },
  { id: "r3", guest: "Eda Ş.", task: "Pastanın kesildiği anı yakala", likes: 0, ratio: "landscape" },
  { id: "r4", guest: "Selin K.", task: "Davetlilerin zarif gülüşlerini yakala", likes: 0, ratio: "landscape" },
  { id: "r5", guest: "Sena B.", task: "En çılgın dans pozunu çek!", likes: 0, ratio: "landscape" },
  { id: "r6", guest: "Deniz A.", task: "Masadaki en komik anı yakala", likes: 0, ratio: "landscape" },
];

export const approvedPhotos: Photo[] = [
  { id: "p1", guest: "Elif K.", task: "Damadın ailesiyle ilk bakış anını yakala", likes: 47, ratio: "portrait" },
  { id: "p2", guest: "Elif K.", task: "Nikah masasındaki mutluluk anını yakala", likes: 58, ratio: "landscape" },
  { id: "p3", guest: "Ali K.", task: "Masadaki en komik anı yakala", likes: 34, ratio: "square" },
  { id: "p4", guest: "Ayşe T.", task: "Gelinin duvağını nazikçe düzeltirken onu çek", likes: 47, ratio: "landscape" },
  { id: "p5", guest: "Murat T.", task: "Nikah yüzüklerinin takıldığı yakın planı çek", likes: 4, ratio: "landscape" },
  { id: "p6", guest: "Murat S.", task: "Damat ve arkadaşlarının eğlenceli pozu", likes: 42, ratio: "portrait" },
  { id: "p7", guest: "Ali K.", task: "Damat ve büyükannesinin dans ettiği anı yakala", likes: 10, ratio: "landscape" },
  { id: "p8", guest: "Mehmet B.", task: "Damat ve arkadaşlarının eğlenceli pozunu yakala", likes: 29, ratio: "portrait" },
  { id: "p9", guest: "Zeynep A.", task: "Misafirlerin dans pistinde coştuğu an", likes: 27, ratio: "portrait" },
  { id: "p10", guest: "Elif S.", task: "Nikah töreninde mutluluk dolu göz göze bakışlar", likes: 52, ratio: "landscape" },
];

export const feedStats = {
  total: 22,
  pending: 6,
  approved: 10,
  rejected: 6,
};

export const galleryStats = {
  photos: 10,
  likes: 327,
  topTask: "En çılgın dans pozunu çek!",
  publicGallery: true,
  /** Saklama penceresi — KVKK gereği 30 gün sonra otomatik silme var */
  retentionNote:
    "Fotoğraflar etkinlik bitiminden 72 saat sonra silinir. İndirme penceresi 18 Kasım 2026, 01:00 tarihinde kapanır.",
};

// --- Sahne şablonları ------------------------------------------------------

export type StageTemplate = {
  id: string;
  name: string;
  description: string;
};

export const stageTemplates: StageTemplate[] = [
  { id: "organik-kolaj", name: "Organik Kolaj", description: "Düzensiz boyutlu kareler" },
  { id: "foto-bulutu", name: "Foto Bulutu", description: "Merkeze yakınsayan düzen" },
  { id: "mozaik-portre", name: "Mozaik Portre", description: "Fotoğraflar birleşip tek görsel olur" },
  { id: "spotlight", name: "Spotlight", description: "Tek büyük kare, yavaş zoom" },
  { id: "polaroid-yigini", name: "Polaroid Yığını", description: "Masaya düşen anı kartları" },
  { id: "3d-karusel", name: "3D Karusel", description: "Perspektifte dönen halka" },
  { id: "zaman-tuneli", name: "Zaman Tüneli", description: "Saat bandında ilerleyen anlar" },
];

// --- Ekip ------------------------------------------------------------------

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  owner?: boolean;
  joinedLabel: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: "m1",
    name: "Ahmet Baturalp Cavlak",
    email: "ahmetbaturalpcavlak@gmail.com",
    owner: true,
    joinedLabel: "12 Haziran 2026",
  },
  { id: "m2", name: "Deniz Aydın", email: "denizaydin@hotmail.com", joinedLabel: "15 Haziran 2026" },
  { id: "m3", name: "Mehmet Yıldız", email: "mehmet@yahoo.com", joinedLabel: "20 Haziran 2026" },
];

export type PendingInvite = {
  id: string;
  email: string;
  sentLabel: string;
  expiresLabel: string;
  /** Süresi dolmak üzere olanlar kırmızı gösteriliyor */
  expiringSoon?: boolean;
};

export const pendingInvites: PendingInvite[] = [
  { id: "i1", email: "serenaysarikaya@gmail.com", sentLabel: "1 gün önce gönderildi", expiresLabel: "6 gün sonra iptal olur" },
  { id: "i2", email: "sebnemferah@hotmail.com", sentLabel: "2 gün önce gönderildi", expiresLabel: "5 gün sonra iptal olur" },
  { id: "i3", email: "kivanctatlitug@yahoo.com", sentLabel: "5 gün önce gönderildi", expiresLabel: "3 gün sonra iptal olur", expiringSoon: true },
];

// --- Paketler --------------------------------------------------------------

export type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  priceSuffix?: string;
  description: string;
  featuresLead: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
  /** Panel içindeki eylem butonunun metni */
  action: string;
  actionVariant: "outline" | "default" | "ghost";
};

export const plans: Plan[] = [
  {
    id: "essential",
    name: "Essential",
    priceLabel: "₺ 2.500",
    priceSuffix: "/ etkinlik",
    description: "Etkileşimli etkinlik deneyimine hızlı ve kolay başlangıç.",
    featuresLead: "Dahil Olan Özellikler",
    features: [
      "QR ile katılım",
      "Manuel Görev Oluşturma",
      "Fotoğraf Yükleme",
      "Canlı Mozaik",
      "Etkinlik Analizi",
      "Dijital Galeri",
      "Standart Destek",
    ],
    action: "Düşür",
    actionVariant: "outline",
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "₺ 5.900",
    priceSuffix: "/ etkinlik",
    description: "Yapay zekâ destekli katılımcı deneyimi ve gelişmiş etkinlik yönetimi.",
    featuresLead: "Essential'daki tüm özelliklere ek olarak",
    features: [
      "Kişiselleştirilmiş Yapay Zekâ Görevleri",
      "Yapay Zekâ İçerik Moderasyonu",
      "Canlı Görsel Deneyimleri",
      "Gelişmiş Etkinlik Analizi",
      "Markaya Özel Deneyim",
      "Öncelikli Destek",
      "Genişletilmiş Dijital Arşiv",
    ],
    current: true,
    popular: true,
    action: "Mevcut Plan",
    actionVariant: "ghost",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Özel Fiyat",
    description:
      "Büyük ölçekli etkinlikler ve kurumsal projeler için tamamen özelleştirilebilir çözüm.",
    featuresLead: "Professional'daki tüm özelliklere ek olarak",
    features: [
      "White Label",
      "Tamamen Özelleştirilebilir Görsel Deneyimler",
      "Özel Tasarım Desteği",
      "Kuruma Özel Geliştirmeler",
      "Gelişmiş Teknik Analiz",
      "Öncelikli Teknik Destek",
    ],
    action: "Satışla İletişime Geç",
    actionVariant: "default",
  },
];

// --- Ayarlar formu ---------------------------------------------------------

export const eventSettings = {
  name: "Ayşe & Mehmet Düğünü",
  type: "dugun",
  date: "2026-07-28",
  startTime: "16:00",
  endTime: "16:00",
  expectedGuests: "220",
  location: "İzmir, Bahar Event Hall",
};
