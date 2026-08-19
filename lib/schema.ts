/**
 * Firestore veri modeli — tipler ve koleksiyon yolları.
 *
 * Yollar tek yerden üretiliyor; string'i elle yazan yer olmasın.
 *
 * ŞU AN SADECE AUTH'UN İHTİYAÇLARI TAM. `events` ve altındaki koleksiyonlar
 * bir sonraki turda dolacak; aşağıdaki taslak, konuştuğumuz kararları
 * kaybetmemek için duruyor (masa yok, kredi rezervasyonu var).
 */

// --- users -----------------------------------------------------------------

export type UserRole = "admin" | "organizer";

export type UserDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  /** Google ile mi e-posta/şifre ile mi geldi — destek sorularında işe yarıyor */
  provider: "password" | "google.com" | string;
};

// --- events (TASLAK — sonraki tur) ------------------------------------------

export type EventStatus = "taslak" | "canli" | "bitti";
export type ModerationMode = "manuel" | "otomatik";

export type EventDoc = {
  id: string;
  /** Etkinliği yaratan organizatör. Yetki kontrolü buna bakıyor. */
  ownerUid: string;
  name: string;
  /** Misafirin QR'la geldiği kısa kod — sunucu üretir, istemci uydurmaz */
  code: string;
  typeId: string;
  /** Kurulum akışındaki katılımcı aralığı: "0-50" | "50-250" | "250+" */
  guestRange: string;
  status: EventStatus;
  moderationMode: ModerationMode;
  /** Misafir başına fotoğraf hakkı */
  creditsPerGuest: number;
  /**
   * Etkinlik penceresi — bu aralığın dışındaki zaman damgalı fotoğraf reddedilir.
   *
   * NULL OLABİLİR: kurulum akışı tarih sormuyor (tür, katılımcı sayısı, isim).
   * Tarih panelin Kurulum Sihirbazı adımında giriliyor. Tarih girilmeden geri
   * sayım, sahne açılışı ve davet süreleri hesaplanamıyor — panel bunu
   * "Tarih belirlenmedi" diye gösteriyor.
   */
  startsAt: string | null;
  endsAt: string | null;

  /**
   * Beklenen misafir sayısı. Görev sayısı ve mozaik yoğunluğu önerisi buna
   * göre hesaplanıyor (sihirbazın 1. adımındaki bilgi notu).
   *
   * Kurulum akışındaki `guestRange` ile karıştırılmamalı: o kaba bir aralık
   * ("50-250"), bu organizatörün girdiği kesin sayı.
   */
  expectedGuests: number | null;
  locationName: string | null;

  /**
   * Sihirbazın 2. adımı / Sahne sayfası: seçilen sahne şablonu.
   *
   * Şablonlar PAKETE GÖRE kısıtlı ve kısıt kapsayan değil ayıran — paket
   * değişince seçili şablon geçersiz kalabiliyor. Doğrulama
   * `lib/stage-templates.ts` içindeki `isTemplateAllowed` ile yapılıyor.
   */
  stageTemplateId: string | null;
  /**
   * Sihirbazın Sahne adımında seçilen mod: mozaik mi, serbest akış mı.
   * Şablon Sahne sayfasında seçiliyor ve bu moda uymak zorunda.
   */
  stageMode: "mozaik" | "akis" | null;
  /** Mozaik referansı: hazır şekil / logo / referans fotoğraf */
  stageReferenceKind: "sekil" | "logo" | "foto" | null;
  /** "Hazır Şekil" seçildiyse hangi siluet */
  stageReferenceShape: string | null;
  /** Logo ya da fotoğraf yüklendiyse R2'deki yolu */
  stageReferenceKey: string | null;

  /** Sihirbazın 3. adımı: AI görev üretimi için girdiler */
  missionSubject: string | null;
  missionTone: string | null;
  missionTheme: string | null;
  missionFacts: string[];

  /** Sihirbazın 4. adımı */
  planId: string | null;

  /**
   * Ödeme yapıldı mı?
   *
   * ÖDEME ENTEGRASYONU YOK (CLAUDE.md kapsam dışı, v2). Bu alan gerçek:
   * panel ve misafir erişimi buna bakıyor. Şimdilik panelde bir düğme
   * doğrudan `true` yapıyor — gerçek sağlayıcı geldiğinde o düğmenin
   * yerine ödeme akışı girecek, alanın anlamı değişmeyecek.
   *
   * Ödenmemiş etkinlikte MİSAFİR GİREMEZ (ürünü ödemeden kullanmanın önünü
   * kesen asıl koruma), ama QR üretimi/baskısı serbest — organizatör masaları
   * ödeme beklerken hazırlayabilsin.
   */
  paid: boolean;
  paidAt: string | null;

  /**
   * Tamamlanan sihirbaz adımları. Kurulum ilerlemesi yüzdesi ve Genel
   * Bakış'taki kontrol listesi buradan besleniyor — alanlara tek tek bakıp
   * tahmin etmiyoruz.
   */
  completedSteps: string[];

  createdAt: string;
};

// --- missions --------------------------------------------------------------

/** Görevin nereden geldiği. Panelde "Kaynak" kolonunda gösteriliyor. */
export type MissionSource = "sablon" | "manuel" | "ai";

/**
 * Etkinliğe KOPYALANMIŞ görev.
 *
 * `missionTemplates` havuzundan etkinlik yaratılırken kopyalanıyor.
 * Kopya olmasının sebebi: organizatör görevi düzenlediğinde havuz bozulmasın.
 */
export type MissionDoc = {
  id: string;
  label: string;
  source: MissionSource;
  /** Kapalı görevler misafire dağıtılmıyor */
  active: boolean;
  /** Kaç misafir bu görevi tamamladı — panelde "n kez" olarak görünüyor */
  completions: number;
  /** Sürükle-bırak sırası */
  order: number;
  /** AI görevleri organizatör onaylamadan misafire gitmiyor */
  pendingApproval: boolean;
  createdAt: string;
};

// --- sessions (misafir) ----------------------------------------------------

/**
 * Misafir oturumu. Hesap yok, üyelik yok.
 *
 * Kimlik = cihaz (deviceToken). İsim sadece ekran etiketi; aynı isimle
 * gelenler kontrol EDİLMİYOR (bilinçli karar — 500 kişide ad-soyad
 * çakışması gerçek misafiri kilitliyordu).
 */
export type SessionDoc = {
  id: string;
  /** Ekranda fotoğrafın altında görünen ad soyad */
  displayName: string;
  /** localStorage'daki jeton — aynı cihaz geri gelince oturumu buluyor */
  deviceToken: string;
  /** Kalan fotoğraf hakkı. Sadece sunucu düşürür. */
  remainingCredits: number;
  /**
   * Verilmiş ama henüz obje inmemiş yükleme izni sayısı.
   * Kredi gerçek inişte düşüyor; bu sayaç arka arkaya intent alıp
   * sınırı delmeyi engelliyor.
   */
  openIntents: number;
  /** KVKK açık rıza zamanı. Kamera izninden ÖNCE alınıyor. */
  consentAt: string;
  /** Bir fotoğrafı reddedildiyse kalan hakları manuel onaya düşer */
  manualReviewOnly: boolean;
  /**
   * Reddedilen fotoğraf için geri verilen hak sayısı.
   *
   * Red hakkı iade ediyor (misafirin suçu olmayabilir) ama SINIRLI:
   * iade sonsuz olsa kötü kare gönderip hakkını geri alan biri sınırsız
   * deneme yapardı — her deneme bize moderasyon maliyeti yazar.
   * Sınır `MAX_REFUNDS` (bkz. upload-complete).
   */
  refunds: number;
  createdAt: string;
};

// --- photos ----------------------------------------------------------------

export type PhotoStatus =
  /** Yükleme izni verildi, obje R2'ye henüz inmedi. Kredi düşmedi. */
  | "awaiting_upload"
  /** Obje indi, moderasyon bekliyor */
  | "pending"
  | "approved"
  | "rejected"
  /** Belirsiz bant ya da 60 sn'den uzun pending — insan kuyruğunda */
  | "manual_review";

export type PhotoDoc = {
  id: string;
  sessionId: string;
  missionId: string;
  r2Key: string;
  status: PhotoStatus;
  bytes?: number;
  /** AI reddettiyse gerekçesi — organizatör panelde neden reddedildiğini görüyor */
  rejectionReason?: string;
  createdAt: string;
};

// --- koleksiyon yolları ----------------------------------------------------

export const paths = {
  users: "users",
  user: (uid: string) => `users/${uid}`,

  events: "events",
  event: (eventId: string) => `events/${eventId}`,

  sessions: (eventId: string) => `events/${eventId}/sessions`,
  session: (eventId: string, sessionId: string) =>
    `events/${eventId}/sessions/${sessionId}`,

  photos: (eventId: string) => `events/${eventId}/photos`,
  photo: (eventId: string, photoId: string) =>
    `events/${eventId}/photos/${photoId}`,

  missions: (eventId: string) => `events/${eventId}/missions`,

  /** EKRANIN DİNLEDİĞİ TEK DOKÜMAN — koleksiyon dinleyicisi kurulmayacak */
  feedLive: (eventId: string) => `events/${eventId}/feed/live`,

  /**
   * Beğeni sayaçları — TEK doküman, içinde photoId → sayı haritası.
   *
   * Fotoğraf başına doküman okumak misafir akışını her yenilemede 60 okumaya
   * çıkarırdı; harita dokümanıyla akış 2 okuma (feed + likes).
   */
  feedLikes: (eventId: string) => `events/${eventId}/feed/likes`,

  missionTemplates: "missionTemplates",
} as const;
