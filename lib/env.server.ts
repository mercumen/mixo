import "server-only";

/**
 * GİZLİ ortam değişkenleri — yalnızca sunucuda.
 *
 * `server-only` paketi sayesinde bu dosya bir Client Component'ten import
 * edilirse build HATA verir. Sırların tarayıcı paketine sızmasına karşı
 * yorum değil, derleyici garantisi.
 *
 * Değerler tembel okunuyor (getter): modül yüklendiği anda hepsini
 * doğrularsak, henüz R2/OpenAI anahtarı girilmemişken sadece Firebase
 * kullanan bir sayfa da patlıyor. Böylece her parça kendi anahtarını
 * gerektiği anda istiyor.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}\n` +
        `.env.local dosyasını kontrol et (şablon: .env.example).`,
    );
  }
  return value;
}

/**
 * Servis hesabı JSON'undaki `private_key` çok satırlıdır ve .env dosyasına
 * tek satır olarak, `\n` dizileriyle yazılır. dotenv çift tırnaklı değerlerde
 * bunları gerçek satır sonuna çevirir ama her ortamda garanti değil —
 * ikisini de tolere ediyoruz.
 */
function normalizePrivateKey(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export const serverEnv = {
  get firebase() {
    return {
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: normalizePrivateKey(required("FIREBASE_PRIVATE_KEY")),
    };
  },

  get r2() {
    return {
      accountId: required("R2_ACCOUNT_ID"),
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
      bucket: required("R2_BUCKET"),
      /**
       * Endpoint TÜRETİLMİYOR, env'den okunuyor.
       *
       * Sebep: R2'de yargı bölgesi (jurisdiction) seçilirse endpoint değişiyor.
       * EU bölgesinde `<hesap>.eu.r2.cloudflarestorage.com`, varsayılanda
       * `<hesap>.r2.cloudflarestorage.com`. Hesap kimliğinden türetmek EU
       * bucket'larda sessizce yanlış adrese gider.
       *
       * Cloudflare panelindeki adresi olduğu gibi alıyoruz — bucket adı
       * OLMADAN (o ayrı bir değişken).
       */
      endpoint: required("R2_ENDPOINT").replace(/\/+$/, ""),
    };
  },

  get openai() {
    return {
      apiKey: required("OPENAI_API_KEY"),
    };
  },
} as const;
