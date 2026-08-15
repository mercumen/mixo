import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env.server";

/**
 * Cloudflare R2 — fotoğraf deposu.
 *
 * R2 S3 uyumlu olduğu için resmi AWS SDK'sı kullanılıyor, Cloudflare'ın
 * kendi SDK'sına gerek yok.
 *
 * ENDPOINT UYARISI: adres env'den geliyor, hesap kimliğinden TÜRETİLMİYOR.
 * Bucket bir yargı bölgesinde (jurisdiction) oluşturulduysa adres değişiyor
 * ve Cloudflare'ın token ekranı bunu YANLIŞ gösteriyor — token sayfası
 * jenerik hesap adresini basıyor, bucket'ın gerçek adresini değil.
 * Bizim bucket EU bölgesinde: `<hesap>.eu.r2.cloudflarestorage.com`
 * (test edildi; `.eu.` olmayan adres çalışmıyor).
 *
 * `region: "auto"` R2'nin beklediği değer.
 */

let cached: S3Client | undefined;

function client(): S3Client {
  if (cached) return cached;

  const { endpoint, accessKeyId, secretAccessKey } = serverEnv.r2;
  cached = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

function bucket() {
  return serverEnv.r2.bucket;
}

/**
 * Misafir fotoğrafının R2'deki yolu.
 *
 * Etkinliğe göre bölünmüş: 30 gün sonra silme (KVKK) ve etkinlik sonu
 * temizliği prefix üzerinden yapılabiliyor.
 */
export function photoKey(eventId: string, photoId: string) {
  return `events/${eventId}/photos/${photoId}.jpg`;
}

/**
 * Mozaik referansının (logo / referans fotoğraf) R2'deki yolu.
 *
 * Zaman damgası var: aynı etkinliğe yeni logo yüklenince eski obje üzerine
 * yazılmıyor, tarayıcı önbelleği bayat görsel göstermiyor. (Objeler
 * `immutable` cache header'ı ile duruyor, aynı anahtara yazmak tehlikeli.)
 */
export function stageReferenceKey(
  eventId: string,
  kind: "logo" | "foto",
  ext: string,
) {
  return `events/${eventId}/reference/${kind}-${Date.now()}.${ext}`;
}

/** CLAUDE.md kural 7: ekran aynı görseli saatlerce tekrar indirmesin. */
export const R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * İmzalı PUT adresi.
 *
 * CACHE-CONTROL BURADA İMZALANMIYOR — bilinçli.
 *
 * Neden: presigned PUT'ta imzalanan header'ı tarayıcının da göndermesi
 * gerekiyor, bu da bucket'ın CORS `AllowedHeaders` listesinde `cache-control`
 * olmasını şart koşuyor. O liste elle yönetiliyor ve yeni ortamda unutulunca
 * yükleme tamamen `Failed to fetch` ile ölüyor — sessiz bir ayak kapanı.
 *
 * Bunun yerine header'ı yükleme sonrası SUNUCU yazıyor (`applyCacheControl`).
 * Böylece CORS'un `content-type` dışında hiçbir header'a izin vermesi
 * gerekmiyor ve kural 7 elle yapılan bir ayara bağlı kalmıyor.
 */
export async function createUploadUrl(input: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: input.key,
      ContentType: input.contentType,
    }),
    { expiresIn: input.expiresInSeconds ?? 900 },
  );
}

/**
 * Yüklenen objeye Cache-Control header'ını yazar.
 *
 * Objeyi kendi üstüne kopyalayıp metadata'yı değiştiriyor — S3/R2'de bir
 * objenin header'ını sonradan değiştirmenin yolu bu. Byte'lar R2 içinde
 * kalıyor, bize inip çıkmıyor.
 *
 * Sessizce başarısız olmuyor ama çağıran taraf hatayı yutabilir: header
 * yazılmasa da dosya kullanılabilir durumda, sadece önbelleklenmiyor.
 */
export async function applyCacheControl(key: string, contentType: string) {
  await client().send(
    new CopyObjectCommand({
      Bucket: bucket(),
      Key: key,
      CopySource: `${bucket()}/${key}`,
      MetadataDirective: "REPLACE",
      ContentType: contentType,
      CacheControl: R2_CACHE_CONTROL,
    }),
  );
}

/** Verilen anahtar için kısa ömürlü okuma adresi (panelde önizleme). */
export async function createReadUrl(key: string, expiresInSeconds = 900) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

/** Anahtar gerçekten indi mi + boyutu ve türü. */
export async function headObject(key: string) {
  try {
    const head = await client().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return {
      bytes: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "application/octet-stream",
      cacheControl: head.CacheControl ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Tarayıcının doğrudan PUT'layacağı imzalı adres.
 *
 * CLAUDE.md kural 1: fotoğraf byte'ları sunucudan GEÇMİYOR. Sunucu sadece bu
 * izin adresini üretiyor; 500 kişi aynı anda yüklerken sunucu 500 küçük JSON
 * isteği görüyor.
 *
 * Ömrü uzun (varsayılan 30 dk): mekan interneti koptuğunda istemci aynı
 * adresi tekrar deniyor. Kısa tutarsak retry kuyruğu (kural 6) çalışmaz ve
 * misafirin hakkı boşa gider.
 *
 * Cache-Control burada İMZALANMIYOR (bkz. createUploadUrl açıklaması):
 * tarayıcının o header'ı göndermesi CORS'a bağımlılık yaratıyor. Header
 * yükleme doğrulandıktan sonra sunucu tarafında yazılıyor.
 */
export async function createPhotoUploadUrl(input: {
  eventId: string;
  photoId: string;
  contentType?: string;
  expiresInSeconds?: number;
}) {
  const key = photoKey(input.eventId, input.photoId);

  const url = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: input.contentType ?? "image/jpeg",
    }),
    { expiresIn: input.expiresInSeconds ?? 1800 },
  );

  return { url, key };
}

/**
 * Obje gerçekten indi mi?
 *
 * Kredi düşümü buna bağlı: istemcinin "yükledim" demesine güvenmiyoruz,
 * R2'ye kendimiz soruyoruz. Boyut da bedava geliyor — byte indirmeden.
 *
 * Yoksa `null` dönüyor, hata fırlatmıyor: "obje yok" beklenen bir durum
 * (istemci PUT'u tamamlamamış olabilir).
 */
export async function getPhotoObjectInfo(eventId: string, photoId: string) {
  try {
    const head = await client().send(
      new HeadObjectCommand({
        Bucket: bucket(),
        Key: photoKey(eventId, photoId),
      }),
    );
    return {
      bytes: head.ContentLength ?? 0,
      contentType: head.ContentType ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Moderasyon için kısa ömürlü okuma adresi.
 *
 * OpenAI'a dosya değil bu URL gönderiliyor. Ömrü kısa (5 dk): bucket private
 * ve 500 kişinin tanınabilir fotoğrafı kişisel veri — uzun ömürlü bir link
 * sızarsa KVKK sorunu olur.
 */
export async function createPhotoReadUrl(
  eventId: string,
  photoId: string,
  expiresInSeconds = 300,
) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: photoKey(eventId, photoId),
    }),
    { expiresIn: expiresInSeconds },
  );
}

/** KVKK "fotoğrafımı sil" ve reddedilen fotoğrafların temizliği için. */
export async function deletePhotoObject(eventId: string, photoId: string) {
  await client().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: photoKey(eventId, photoId),
    }),
  );
}
