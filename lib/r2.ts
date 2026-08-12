import "server-only";

import {
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
 * Cache-Control burada imzalanıyor — obje indiği anda doğru header'la duruyor
 * (kural 7): ekran aynı fotoğrafı saatlerce tekrar indirmiyor.
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
      CacheControl: "public, max-age=31536000, immutable",
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
