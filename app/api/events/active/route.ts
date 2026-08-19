import { cookies } from "next/headers";
import { requireOwnedEvent } from "@/lib/event-access";
import { ACTIVE_EVENT_COOKIE } from "@/app/dashboard/_lib/context";

/**
 * Panelde açık olan etkinliği değiştirir.
 *
 * Sahiplik BURADA doğrulanıyor (`requireOwnedEvent`), yani çereze başkasının
 * etkinlik kimliğini yazdırmak mümkün değil. Okuma tarafı da ayrıca
 * doğruluyor — iki kat.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (typeof body.eventId !== "string") {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const access = await requireOwnedEvent(body.eventId);
  if (!access.ok) return access.response;

  (await cookies()).set(ACTIVE_EVENT_COOKIE, body.eventId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
  });

  return Response.json({ ok: true });
}
