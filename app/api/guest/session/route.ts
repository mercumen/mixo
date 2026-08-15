import { getDb } from "@/lib/firebase/admin";
import {
  createSession,
  eventWindowState,
  findEventByCode,
  getGuestState,
} from "@/lib/guest-session";
import { paths, type MissionDoc } from "@/lib/schema";

/**
 * Misafir oturumu açma / geri yükleme.
 *
 * GET  ?code=X&token=Y → etkinlik durumu + (varsa) oturum. Misafir uygulaması
 *                        açılışta bunu çağırıp hangi ekranı göstereceğini
 *                        buradan öğreniyor.
 * POST                 → rıza + ad soyad ile yeni oturum
 *
 * Auth yok — CLAUDE.md: misafir hesabı yok, üyelik yok. Kimlik, oturum
 * jetonunun kendisi (bkz. lib/guest-session.ts).
 */

const MAX_NAME = 60;
const MIN_NAME = 2;

/** Misafire gösterilecek görevler: kapalı ve onay bekleyenler hariç. */
async function activeMissions(eventId: string, limit = 50) {
  const snap = await getDb()
    .collection(paths.missions(eventId))
    .orderBy("order", "asc")
    .limit(limit)
    .get();

  return snap.docs
    .map((d) => d.data() as MissionDoc)
    .filter((m) => m.active && !m.pendingApproval)
    .map((m) => ({ id: m.id, label: m.label }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const event = await findEventByCode(code);
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const windowState = eventWindowState(event);

  // Oturum varsa görevleri de gönderiyoruz — misafir tek istekte hazır oluyor
  const guest = token ? await getGuestState(event.id, token) : null;

  return Response.json({
    event: {
      name: event.name,
      code: event.code,
      typeId: event.typeId,
      windowState,
      creditsPerGuest: event.creditsPerGuest,
    },
    guest,
    missions: guest ? await activeMissions(event.id) : [],
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { code, displayName, consent } = body;

  const event = await findEventByCode(typeof code === "string" ? code : "");
  if (!event) {
    return Response.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const windowState = eventWindowState(event);
  if (windowState !== "acik") {
    return Response.json(
      { error: "Etkinlik şu anda katılıma kapalı.", windowState },
      { status: 409 },
    );
  }

  /**
   * KVKK: açık rıza olmadan oturum açılmıyor.
   * İstemcinin kutuyu işaretlediğini burada da doğruluyoruz — arayüz
   * atlanabilir, kayıt atlanamaz.
   */
  if (consent !== true) {
    return Response.json(
      { error: "Devam etmek için aydınlatma metnini onaylamalısınız." },
      { status: 400 },
    );
  }

  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    return Response.json(
      { error: "Ad soyad girin (en az 2 karakter)." },
      { status: 400 },
    );
  }

  try {
    const guest = await createSession({ event, displayName: name });
    return Response.json(
      {
        guest,
        missions: await activeMissions(event.id),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("oturum açılamadı:", error);
    return Response.json(
      { error: "Bağlanılamadı, tekrar deneyin." },
      { status: 500 },
    );
  }
}
