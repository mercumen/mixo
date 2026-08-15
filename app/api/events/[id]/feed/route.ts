import { requireOwnedEvent } from "@/lib/event-access";
import { setFeedFrozen } from "@/lib/feed";

/**
 * "Ekranı dondur" acil butonu (CLAUDE.md).
 *
 * Ekranın önünde 200 kişi varken kötü bir kare çıktığında organizatörün tek
 * hamlede dönüşü durdurabilmesi gerekiyor — sonra sakin sakin reddeder.
 * Feed dolmaya devam ediyor, duran sadece ekranın dönüşü.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (typeof body.frozen !== "boolean") {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  await setFeedFrozen(id, body.frozen);
  return Response.json({ ok: true, frozen: body.frozen });
}
