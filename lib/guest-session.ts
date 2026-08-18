import "server-only";

import { getDb } from "@/lib/firebase/admin";
import { paths, type EventDoc, type SessionDoc } from "@/lib/schema";

/**
 * Misafir oturumu — hesap yok, üyelik yok.
 *
 * KİMLİK = CİHAZ. QR'ı okutan her cihaz kendi oturumunu alıyor. İsim sadece
 * ekran etiketi; aynı isimle gelenler kontrol EDİLMİYOR (bilinçli karar:
 * 500 kişilik bir düğünde ad-soyad çakışması gerçek misafiri kilitliyordu).
 *
 * JETON NEDEN İMZALANMIYOR: oturum dokümanının kimliği zaten tahmin edilemez
 * rastgele bir dize ve doğrudan doküman anahtarı olarak kullanılıyor. Yani
 * jetonun kendisi taşıyıcı sır. İmzalamak fazladan bir gizli anahtar (ve onu
 * her ortama girme zorunluluğu) getirirdi, karşılığında hiçbir şey vermezdi —
 * jetonu ele geçiren zaten oturumun kendisine erişmiş oluyor.
 *
 * Jetonu paylaşan misafir yalnızca KENDİ hakkını paylaşıyor; başkasının
 * kredisine ya da verisine erişemiyor.
 */

/** localStorage'da duran anahtar — misafir geri geldiğinde oturumu buluyor. */
export const GUEST_TOKEN_STORAGE_KEY = "mixo:guest";

const TOKEN_BYTES = 24;

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Kod → etkinlik. Tek alan eşitliği olduğu için bileşik indeks gerekmiyor. */
export async function findEventByCode(code: string): Promise<EventDoc | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(normalized)) return null;

  const snap = await getDb()
    .collection(paths.events)
    .where("code", "==", normalized)
    .limit(1)
    .get();

  return snap.empty ? null : (snap.docs[0].data() as EventDoc);
}

export type EventWindowState =
  | "acik"
  /** Tarih girilmemiş — kurulum bitmemiş, misafir alınmıyor */
  | "hazir_degil"
  | "baslamadi"
  | "bitti";

/**
 * Etkinlik şu an misafir kabul ediyor mu?
 *
 * CLAUDE.md: zaman damgası etkinlik penceresi dışındaki fotoğraf reddediliyor.
 * Kontrolü girişte yapıyoruz ki misafir 20 dakika uğraşıp sonunda red yemesin.
 *
 * Pencereye pay ekliyoruz: misafirler kapıda erken toplanıyor ve gece sonunda
 * son kareler geç yükleniyor. Sert kesim sahada şikâyet üretiyor.
 */
const EARLY_GRACE_MS = 2 * 60 * 60 * 1000; // 2 saat önce
const LATE_GRACE_MS = 2 * 60 * 60 * 1000; // 2 saat sonra

export function eventWindowState(
  event: EventDoc,
  now = Date.now(),
): EventWindowState {
  if (!event.startsAt) return "hazir_degil";

  const start = new Date(event.startsAt).getTime();
  if (Number.isNaN(start)) return "hazir_degil";

  if (now < start - EARLY_GRACE_MS) return "baslamadi";

  const end = event.endsAt ? new Date(event.endsAt).getTime() : null;
  if (end && !Number.isNaN(end) && now > end + LATE_GRACE_MS) return "bitti";

  return "acik";
}

/** Misafirin kendi durumu — arayüzde kalan hak vs. göstermek için. */
export type GuestState = {
  token: string;
  displayName: string;
  remainingCredits: number;
  manualReviewOnly: boolean;
};

function toGuestState(session: SessionDoc): GuestState {
  return {
    token: session.id,
    displayName: session.displayName,
    // Rezerve edilmiş izinler de düşülmüş sayılıyor: misafire "3 hakkın var"
    // deyip sonra reddetmek yerine gerçek kullanılabilir sayıyı gösteriyoruz
    remainingCredits: Math.max(
      0,
      session.remainingCredits - session.openIntents,
    ),
    manualReviewOnly: session.manualReviewOnly,
  };
}

export async function getSession(
  eventId: string,
  token: string,
): Promise<SessionDoc | null> {
  if (!token || token.length < 16) return null;
  const snap = await getDb().doc(paths.session(eventId, token)).get();
  return snap.exists ? (snap.data() as SessionDoc) : null;
}

export async function getGuestState(
  eventId: string,
  token: string,
): Promise<GuestState | null> {
  const session = await getSession(eventId, token);
  return session ? toGuestState(session) : null;
}

/**
 * Yeni oturum açar.
 *
 * Doküman kimliği = jeton. Böylece oturuma erişim tek doküman okuması —
 * sorgu yok, indeks yok.
 *
 * `consentAt` KVKK açık rıza zamanı. Rıza kamera izninden ÖNCE alınıyor ve
 * kaydı burada tutuluyor; sonradan "bu kişi onay verdi mi" sorusuna cevap
 * verebilmek için şart.
 */
export async function createSession(input: {
  event: EventDoc;
  displayName: string;
}): Promise<GuestState> {
  const token = newToken();
  const now = new Date().toISOString();

  const session: SessionDoc = {
    id: token,
    displayName: input.displayName.trim().slice(0, 60),
    deviceToken: token,
    remainingCredits: input.event.creditsPerGuest,
    openIntents: 0,
    consentAt: now,
    manualReviewOnly: false,
    refunds: 0,
    createdAt: now,
  };

  await getDb().doc(paths.session(input.event.id, token)).set(session);
  return toGuestState(session);
}
