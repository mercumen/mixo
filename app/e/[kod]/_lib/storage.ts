/**
 * Misafir tarafının localStorage katmanı.
 *
 * Anahtarlar ETKİNLİK KODUYLA ayrılıyor: aynı telefon iki farklı düğüne
 * gidebilir (hafta arayla), oturumlar birbirini ezmemeli.
 *
 * localStorage her ortamda garanti değil (Safari private mode fırlatıyor) —
 * her erişim try/catch içinde, patlarsa misafir sadece "hatırlanmayan"
 * misafire dönüşüyor, uygulama çalışmaya devam ediyor.
 */

export type UploadRecord = {
  photoId: string;
  status: "sent" | "failed";
  /** Küçük önizleme (data URL) — "Gönderildi" satırındaki kare */
  thumb?: string;
  /**
   * Sadece BAŞARISIZ yüklemede duruyor: sıkıştırılmış fotoğrafın kendisi
   * (data URL, ~450 KB tavan) + aynı imzalı adres. Sayfa yenilense bile
   * "Tekrar Dene" çalışıyor — CLAUDE.md kural 6'nın yerel kuyruğu bu.
   */
  dataUrl?: string;
  uploadUrl?: string;
};

export type GuestProgress = {
  /** Bu misafire dağıtılan görevler (sıralı) */
  missionIds: string[];
  /** Şu an açık olan görevin missionIds içindeki yeri */
  index: number;
  uploads: Record<string, UploadRecord>;
  /** Görev açılışı ("İlk Göreviniz Hazır") bir kez gösteriliyor */
  revealed: boolean;
};

const key = (code: string, suffix: string) => `mixo:guest:${code}:${suffix}`;

function read<T>(k: string): T | null {
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(k: string, value: unknown) {
  try {
    window.localStorage.setItem(k, JSON.stringify(value));
  } catch {
    // Private mode / dolu depo: sessizce geç — oturum sunucuda yaşıyor
  }
}

// --- oturum jetonu -----------------------------------------------------------

export function getStoredToken(code: string): string | null {
  return read<string>(key(code, "token"));
}

export function storeToken(code: string, token: string) {
  write(key(code, "token"), token);
}

// --- görev ilerlemesi --------------------------------------------------------

export function getProgress(code: string): GuestProgress | null {
  return read<GuestProgress>(key(code, "progress"));
}

export function storeProgress(code: string, progress: GuestProgress) {
  write(key(code, "progress"), progress);
}

// --- beğeniler ---------------------------------------------------------------

/** Bu cihazın beğendiği kareler — kalbin dolu/boş hâli buradan. */
export function getLikedIds(code: string): Set<string> {
  return new Set(read<string[]>(key(code, "likes")) ?? []);
}

export function storeLikedIds(code: string, ids: Set<string>) {
  write(key(code, "likes"), [...ids]);
}
