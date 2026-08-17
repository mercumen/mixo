import "server-only";

import { missionTones } from "@/lib/mission-tones";
import { eventTypes } from "@/app/(onboarding)/_lib/event-setup";

/**
 * AI görev üretimi — Vercel AI Gateway üzerinden.
 *
 * NEDEN GATEWAY, NEDEN SDK DEĞİL:
 * Gateway sağlayıcı fiyatına sıfır komisyon bindiriyor, takım başına aylık
 * bedava kredi veriyor ve model değiştirmeyi tek dizeye indiriyor. Ucu
 * OpenAI uyumlu olduğu için düz `fetch` yetiyor — tek bir çağrı için AI SDK
 * paketini projeye sokmadık (CLAUDE.md: yeni bağımlılık eklemeden önce sor).
 *
 * MODEL SEÇİMİ: bizim hacmimizde (etkinlik başına birkaç üretim) fiyat
 * farkları gürültü — üretim başı maliyet kuruşun çok altında. O yüzden
 * seçim ucuzluğa değil Türkçe metin kalitesine göre yapıldı. Beğenilmezse
 * aşağıdaki tek sabit değişiyor, başka hiçbir yere dokunulmuyor.
 */

const MODEL = "google/gemini-3.1-flash-lite";
const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

/** Tek çağrıda üretilecek görev sayısı. */
export const MISSIONS_PER_RUN = 8;

/** Görev metni tavanı — masadaki telefonda okunabilir kalması için. */
const MAX_LABEL = 90;

/** Model takılırsa misafiri değil organizatörü bekletiyoruz; yine de sınır şart. */
const TIMEOUT_MS = 30_000;

export type MissionAiInput = {
  typeId: string;
  /** Kim/ne için: "Elif & Can", "Acme Corp" */
  subject: string | null;
  toneId: string | null;
  theme: string | null;
  facts: string[];
  /** Zaten havuzda olan görevler — model bunları tekrar etmesin */
  existingLabels: string[];
};

/**
 * Prompt.
 *
 * Kurallar sahadan geliyor: görev masada okunuyor, misafir kalabalıkta
 * telefonla çekiyor, elinde aksesuar yok ve sahne arkasına giremiyor.
 * Bunları söylemezsek model "gelinin çeyiz sandığını aç ve fotoğrafla"
 * gibi uygulanamaz görevler üretiyor.
 */
function buildPrompt(input: MissionAiInput) {
  const type = eventTypes.find((t) => t.id === input.typeId);
  const tone = missionTones.find((t) => t.id === input.toneId);

  const system = [
    "Sen bir etkinlik fotoğraf görevi yazarısın. Misafirlere telefonlarıyla çekecekleri kısa görevler yazıyorsun.",
    "",
    "KURALLAR:",
    "- Türkçe yaz. Emir kipi kullan, tek cümle, en fazla 90 karakter.",
    "- Misafir kalabalık bir salonda, elinde sadece telefonuyla çekebilmeli.",
    "- Aksesuar, hazırlık, sahne arkasına erişim ya da başkasını yönlendirme gerektirme.",
    "- Her görev farklı bir an ya da özne olsun; aynı fikri iki kez yazma.",
    "- Kimseyi utandıracak, özel hayata giren ya da rahatsız edici görev yazma.",
    "- Süslü edebiyat yapma; misafir okuyunca ne çekeceğini anında anlasın.",
  ].join("\n");

  const lines: string[] = [`Etkinlik türü: ${type?.label ?? input.typeId}`];
  if (input.subject) lines.push(`Kim için: ${input.subject}`);
  if (tone) lines.push(`İstenen ton: ${tone.label} — ${tone.hint}`);
  if (input.theme) lines.push(`Tema: ${input.theme}`);

  if (input.facts.length > 0) {
    lines.push(
      `Bu kişilere/kuruma özel bilgiler (görevlere DOĞAL biçimde işle, zorlama): ${input.facts.join(", ")}`,
    );
  }

  if (input.existingLabels.length > 0) {
    lines.push(
      "",
      "Havuzda ZATEN olan görevler — bunları tekrar etme, benzerini de yazma:",
      ...input.existingLabels.slice(0, 40).map((l) => `- ${l}`),
    );
  }

  lines.push("", `${MISSIONS_PER_RUN} adet yeni görev üret.`);

  return { system, user: lines.join("\n") };
}

export class MissionAiError extends Error {}

/**
 * Görev üretir. Başarısızlıkta `MissionAiError` fırlatır — çağıran taraf
 * bunu organizatöre gösterilebilir bir mesaja çeviriyor.
 */
export async function generateMissions(
  input: MissionAiInput,
): Promise<string[]> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new MissionAiError("AI servisi yapılandırılmamış.");

  const { system, user } = buildPrompt(input);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout?.(TIMEOUT_MS),
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        /**
         * Yapılandırılmış çıktı: modelden JSON şemasına UYMASI isteniyor,
         * "şöyle döndür" diye rica edilmiyor. Metin ayrıştırma ve yarım
         * JSON derdi böylece ortadan kalkıyor.
         */
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "gorevler",
            strict: true,
            schema: {
              type: "object",
              properties: {
                gorevler: { type: "array", items: { type: "string" } },
              },
              required: ["gorevler"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
  } catch {
    throw new MissionAiError("AI servisine ulaşılamadı, tekrar deneyin.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("AI Gateway hatası:", res.status, body.slice(0, 400));
    throw new MissionAiError(
      res.status === 429
        ? "AI servisi şu an yoğun, biraz sonra deneyin."
        : "Görevler üretilemedi, tekrar deneyin.",
    );
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new MissionAiError("AI boş yanıt döndü.");

  let parsed: { gorevler?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new MissionAiError("AI yanıtı okunamadı.");
  }

  return sanitize(parsed.gorevler, input.existingLabels);
}

/**
 * Modelin çıktısına GÜVENMİYORUZ.
 *
 * Şema dizi ve string garantiliyor ama içeriği garantilemiyor: boş metin,
 * tavanı aşan cümle, aynı görevin tekrarı ve havuzdakiyle çakışma hâlâ
 * mümkün. Veritabanına yazmadan önce burada eleniyorlar.
 */
function sanitize(raw: unknown, existing: string[]): string[] {
  if (!Array.isArray(raw)) throw new MissionAiError("AI yanıtı beklenmedik.");

  const seen = new Set(existing.map(normalize));
  const out: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string") continue;
    const label = item.trim().replace(/\s+/g, " ");
    if (label.length < 8 || label.length > MAX_LABEL) continue;

    const key = normalize(label);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(label);
    if (out.length >= MISSIONS_PER_RUN) break;
  }

  if (out.length === 0) {
    throw new MissionAiError("Kullanılabilir görev üretilemedi, tekrar deneyin.");
  }
  return out;
}

/** Tekrar kontrolü için: büyük/küçük harf, noktalama ve boşluk farkını yok say. */
function normalize(label: string): string {
  return label
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
