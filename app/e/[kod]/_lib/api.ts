/**
 * Misafir API istemcisi — ince fetch sarmalayıcıları.
 *
 * Hata sözleşmesi: sunucu her hata gövdesinde { error: "insan diliyle mesaj" }
 * dönüyor; buradaki sarmalayıcılar onu Error.message olarak fırlatıyor,
 * ekranlar da doğrudan gösteriyor.
 */

export type GuestInfo = {
  token: string;
  displayName: string;
  remainingCredits: number;
  manualReviewOnly: boolean;
};

export type Mission = { id: string; label: string };

export type FeedItem = {
  photoId: string;
  guestName: string;
  missionLabel: string;
  url: string;
  likes: number;
  mine: boolean;
};

export type SessionResponse = {
  event: {
    name: string;
    code: string;
    typeId: string;
    windowState: "acik" | "hazir_degil" | "baslamadi" | "bitti";
    creditsPerGuest: number;
  };
  guest: GuestInfo | null;
  missions: Mission[];
};

/**
 * İstek zaman aşımı.
 *
 * ŞART: mobil şebeke bağlantıyı reddetmek yerine ASKIDA bırakabiliyor —
 * `fetch` o zaman ne çözülüyor ne reddediliyor, sonsuza kadar bekliyor.
 * Açılış isteği böyle takılınca misafir nabız atan logoya bakakalıyordu
 * (sahada yaşandı). Zaman aşımı bunu bir HATAYA çeviriyor; hatayı zaten
 * ele alan yollar (SSR penceresiyle devam, "Tekrar Dene") devreye giriyor.
 */
const TIMEOUT_MS = 12_000;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      // AbortSignal.timeout: iOS 16+ ve Chrome 103+; daha eskisinde
      // signal `undefined` kalıyor, davranış eski haline dönüyor.
      signal: AbortSignal.timeout?.(TIMEOUT_MS),
    });
  } catch {
    // Mekan interneti: fetch'in kendisi patladıysa insan diliyle söyle
    throw new Error("Bağlantı kurulamadı. İnternetini kontrol et.");
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof body.error === "string" ? body.error : "Bir şeyler ters gitti.";
    throw new Error(message);
  }
  return body as T;
}

export function fetchSession(code: string, token: string | null) {
  const params = new URLSearchParams({ code });
  if (token) params.set("token", token);
  return request<SessionResponse>(`/api/guest/session?${params}`);
}

export function createSession(code: string, displayName: string) {
  return request<{ guest: GuestInfo; missions: Mission[] }>(
    "/api/guest/session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Rıza kutusu ayrı bir ekran değil: isim ekranındaki metinle alınıyor
      body: JSON.stringify({ code, displayName, consent: true }),
    },
  );
}

export function requestUploadIntent(
  code: string,
  token: string,
  missionId: string,
) {
  return request<{ photoId: string; uploadUrl: string }>(
    "/api/guest/upload-intent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, token, missionId }),
    },
  );
}

export function completeUpload(code: string, token: string, photoId: string) {
  return request<{ ok: boolean; status: string }>(
    "/api/guest/upload-complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, token, photoId }),
    },
  );
}

export function fetchFeed(code: string, token: string | null) {
  const params = new URLSearchParams({ code });
  if (token) params.set("token", token);
  return request<{ items: FeedItem[] }>(`/api/guest/feed?${params}`);
}

export function sendLike(
  code: string,
  token: string,
  photoId: string,
  liked: boolean,
) {
  return request<{ ok: boolean }>("/api/guest/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, token, photoId, liked }),
  });
}

export function deletePhoto(code: string, token: string, photoId: string) {
  return request<{ ok: boolean }>("/api/guest/photo", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, token, photoId }),
  });
}
