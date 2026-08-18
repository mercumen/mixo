import "server-only";

import { createPhotoReadUrl } from "@/lib/r2";

/**
 * Görsel moderasyon — Vercel AI Gateway üzerinden görsel anlayan model.
 *
 * NEDEN AYRI BİR NSFW SINIFLANDIRICI DEĞİL:
 * Gateway'de moderation ucu yok (ölçüldü: /v1/moderations 400 dönüyor,
 * listede moderation modeli de yok). Onun yerine görsel LLM'e NE ARADIĞIMIZI
 * tarif ediyoruz. Bu aslında daha isabetli: CLAUDE.md "NSFW modeli el
 * hareketini, utandırıcı kareyi, istemsiz kişileri yakalamıyor" diye
 * uyarıyordu — o uyarı eski skor tabanlı sınıflandırıcılar içindi, prompt'a
 * yazılabilen bir modele sorulduğunda bunlar da kapsama giriyor.
 *
 * BYTE'LAR BURADAN GEÇİYOR — CLAUDE.md'den bilinçli sapma.
 * CLAUDE.md "dosyayı değil URL'yi gönder" diyor; o şema OpenAI'ın URL kabul
 * eden moderation ucuna dayanıyordu. ÖLÇÜLDÜ: Gateway uzaktaki görseli
 * indiremiyor ("Cannot fetch content from the provided URL"). Bu yüzden
 * fotoğrafı sunucuda R2'den okuyup base64 olarak gönderiyoruz.
 * Yükleme yolu etkilenmiyor (kural 1 hâlâ geçerli: misafirin byte'ları
 * doğrudan R2'ye gidiyor), sadece moderasyon adımı fotoğrafı bir kez okuyor.
 *
 * KARAR İKİLİ (evet/hayır) — ürün kararı. Belirsiz bant YOK: model kararsız
 * kalsa da bir taraf seçiyor. Teknik ARIZA bunun dışında: çağrı patlarsa
 * fotoğraf onaylanmıyor, insan kuyruğuna düşüyor (bkz. upload-complete ve
 * takılan kareleri süpüren cron).
 */

const MODEL = "google/gemini-2.5-flash-lite";
const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

/** Model takılırsa misafir "gönderildi" cevabını beklemiyor (after() içinde). */
const TIMEOUT_MS = 25_000;

/** Moderasyon için okunan adresin ömrü — sadece bizim sunucu kullanıyor. */
const READ_TTL_SECONDS = 120;

/**
 * Prompt'un temel kuralı: VARSAYILAN ONAY.
 *
 * ÖLÇÜMLE ÖĞRENİLDİ (18 Ağustos): ilk sürümde "emin değilsen reddet" yazıyordu
 * ve model dört test karesinin üçünü yanlışlıkla reddetti — masadaki kadehi ve
 * pastayı bile "içeriği belirsiz" diye eledi. Karar ikili olduğu için
 * kararsızlığı redde bağlamak modeli her şeyi reddetmeye itiyor.
 *
 * Doğru asimetri şu: burada YANLIŞ RED pahalı — misafirin gerçek anısı
 * siliniyor, hakkı iade edilip tekrar deniyor, kimse memnun olmuyor. Belirsiz
 * bir karenin ekrana düşmesi ise zararsız: on saniye bulanık bir fotoğraf.
 * O yüzden red için GÖRÜNÜR bir ihlal şart; "ne olduğunu anlamadım" red
 * sebebi değil.
 */
const SYSTEM = [
  "Sen bir etkinlik ekranı moderatörüsün. Düğün, nişan ve kurumsal etkinliklerde",
  "misafirlerin telefonla çektiği fotoğraflar SALONDAKİ DEV EKRANDA gösterilecek.",
  "",
  "VARSAYILANIN ONAY. Bir fotoğrafı ancak aşağıdakilerden birini AÇIKÇA",
  "GÖRÜYORSAN reddet:",
  "- cinsel içerik, çıplaklık, iç çamaşırı",
  "- müstehcen ya da kaba el hareketi",
  "- şiddet, kan, silah",
  "- kasten çekilmiş, yakın plan vücut bölgesi",
  "- OKUNABİLİR özel bilgi: kimlik numarası, telefon, adres, banka kartı",
  "- birinin açıkça utanacağı hâli: yerde/düşmüş, kusan, baygın",
  "",
  "BUNLAR RED SEBEBİ DEĞİL — onayla:",
  "- fotoğrafın karanlık, bulanık, gürültülü ya da kötü çekilmiş olması",
  "- ne olduğunu tam anlayamaman; konunun belirsiz görünmesi",
  "- soyut, boş, anlamsız ya da yanlışlıkla çekilmiş gibi duran kareler",
  "- masada içki kadehi, kutlama, dans, yemek, pasta, dekor, mekan, çiçek",
  "- insanlar, portreler, gruplar, gülen ya da bağıran yüzler",
  "- ağzı açık, komik ya da tuhaf ifadeler",
  "",
  "Kararsız kalırsan ONAYLA. Red, gördüğün somut bir ihlale dayanmalı;",
  "şüphe ya da kalitesizlik red sebebi değil.",
].join("\n");

export type ModerationVerdict = {
  uygun: boolean;
  sebep: string;
};

export class ModerationError extends Error {}

/**
 * Fotoğrafı R2'den okuyup base64 veri adresine çevirir.
 *
 * Boyut sınırı: istemci ~350 KB hedefliyor, 6 MB'a kadar kabul ediyoruz
 * (upload-complete zaten üstünü reddediyor). Base64 şişmesi ~%33.
 */
async function readAsDataUrl(
  eventId: string,
  photoId: string,
): Promise<string> {
  const url = await createPhotoReadUrl(eventId, photoId, READ_TTL_SECONDS);

  const res = await fetch(url, { signal: AbortSignal.timeout?.(15_000) });
  if (!res.ok) {
    throw new ModerationError(`fotoğraf okunamadı (${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "image/jpeg";
  return `data:${type};base64,${buf.toString("base64")}`;
}

/**
 * Fotoğrafı denetler. Karar ikili.
 *
 * Hata durumunda `ModerationError` fırlatır — çağıran taraf bunu ONAY
 * SAYMIYOR, insan kuyruğuna düşürüyor.
 */
export async function moderatePhoto(
  eventId: string,
  photoId: string,
): Promise<ModerationVerdict> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new ModerationError("moderasyon yapılandırılmamış");

  const dataUrl = await readAsDataUrl(eventId, photoId);

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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu fotoğraf salondaki dev ekranda gösterilebilir mi?",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        /**
         * Yapılandırılmış çıktı: `uygun` bool, `sebep` kısa Türkçe.
         *
         * Güven skoru İSTEMİYORUZ — ölçümde modeller aynı alanı 0-1 ve
         * 0-100 ölçeğinde karışık doldurdu (gemini 1, nova 95). Eşik
         * karşılaştırması yapacak olsak bu sessizce yanlış çalışırdı.
         * Karar ikili olduğu için skora ihtiyaç da yok.
         */
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "karar",
            strict: true,
            schema: {
              type: "object",
              properties: {
                uygun: { type: "boolean" },
                sebep: { type: "string" },
              },
              required: ["uygun", "sebep"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
  } catch {
    throw new ModerationError("moderasyon servisine ulaşılamadı");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ModerationError(
      `moderasyon reddedildi (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new ModerationError("moderasyon boş yanıt döndü");

  let parsed: { uygun?: unknown; sebep?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ModerationError("moderasyon yanıtı okunamadı");
  }

  if (typeof parsed.uygun !== "boolean") {
    throw new ModerationError("moderasyon kararı beklenmedik biçimde geldi");
  }

  return {
    uygun: parsed.uygun,
    sebep:
      typeof parsed.sebep === "string" ? parsed.sebep.slice(0, 200) : "",
  };
}
