import { timingSafeEqual } from "node:crypto";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

/**
 * Site kilidi parola doğrulama (geçici, lansmana kadar — bkz. lib/gate.ts).
 *
 * Doğru parola → 30 günlük HttpOnly çerez. Yanlış deneme yapay olarak
 * yavaşlatılıyor: tek parolalı bir kapıda kaba kuvvetin tek panzehiri zaman.
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const WRONG_DELAY_MS = 800;

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual uzunluk eşitliği ister; uzunluk sızıntısı burada önemsiz
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const expected = process.env.GATE_PASSWORD;
  if (!expected) {
    // Kilit devre dışıysa kapı zaten açık
    return Response.json({ ok: true });
  }

  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // boş bırak — aşağıda yanlış parola muamelesi görür
  }

  if (!password || !safeEqual(password, expected)) {
    await new Promise((r) => setTimeout(r, WRONG_DELAY_MS));
    return Response.json({ error: "Parola yanlış." }, { status: 401 });
  }

  const token = gateToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${GATE_COOKIE}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
    },
  });
}
