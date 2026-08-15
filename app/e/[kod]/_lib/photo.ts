/**
 * Fotoğraf boru hattının istemci ucu: sıkıştır → izin al → R2'ye PUT →
 * tamamlandı de.
 *
 * CLAUDE.md kural 1: byte'lar sunucudan geçmiyor, tarayıcı doğrudan R2'ye
 * PUT'luyor. Kural 5: canvas ile max 1600px, JPEG (HEIC'i de çözüyor),
 * hedef ~350 KB. Kural 6: giden PUT kopan mekan internetine karşı
 * kendi kendine tekrar deniyor.
 */

const MAX_DIMENSION = 1600;
/** Bu boyutun altına inene kadar kalite düşürülüyor */
const TARGET_BYTES = 450_000;
const THUMB_SIZE = 120;

export type CompressedPhoto = {
  blob: Blob;
  /** Görev kartındaki "Gönderildi" satırının küçük karesi */
  thumb: string;
  /** Başarısız yüklemede localStorage'a yazılan tam hâl */
  dataUrl: string;
};

/**
 * Kaynağı çöz. `createImageBitmap` EXIF dönüşünü kendisi uyguluyor
 * (`imageOrientation`); desteklemeyen eski Safari'de <img> yoluna düşüyoruz —
 * o yol da modern iOS'ta EXIF'i kendiliğinden uyguluyor.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function drawScaled(
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  maxDim: number,
): HTMLCanvasElement {
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height =
    "naturalHeight" in source ? source.naturalHeight : source.height;

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode başarısız."))),
      "image/jpeg",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const source = await decode(file);

  const canvas = drawScaled(source, MAX_DIMENSION);
  if ("close" in source) source.close();

  // Kaliteyi hedefe inene kadar kademeli düşür — tek encode'la şansa bırakma
  let quality = 0.82;
  let blob = await toBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await toBlob(canvas, quality);
  }

  const thumbCanvas = drawScaled(canvas, THUMB_SIZE);
  const thumb = thumbCanvas.toDataURL("image/jpeg", 0.7);

  return { blob, thumb, dataUrl: await blobToDataUrl(blob) };
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * R2'ye PUT — kendi kendine 3 deneme (1 sn / 3 sn / 7 sn aralarla).
 *
 * İmzalı adres 30 dakika geçerli; kopan bağlantıda AYNI adres tekrar
 * deneniyor, yeni izin İSTENMİYOR — tek çekim tek rezervasyon.
 */
export async function putWithRetry(url: string, blob: Blob): Promise<void> {
  const waits = [1000, 3000, 7000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= waits.length; attempt++) {
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (res.ok) return;
      lastError = new Error(`R2 ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < waits.length) await delay(waits[attempt]);
  }

  throw lastError instanceof Error ? lastError : new Error("Yükleme başarısız.");
}
