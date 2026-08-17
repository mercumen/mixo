"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

/**
 * Ekranın fotoğraf kaynağı.
 *
 * CLAUDE.md kural 2: ekran ASLA koleksiyon dinlemiyor. Burada TEK dokümana
 * (`events/{id}/feed/live`) tek bir listener kuruluyor. Koleksiyon dinleyicisi
 * her yeni fotoğrafta okuma harcar ve günlük kotayı gecenin ortasında bitirir.
 *
 * Security Rules bu dokümana herkese açık okuma veriyor (ekran oturum
 * açmıyor, laptop fullscreen çalışıyor) — o yüzden istemci SDK yeterli,
 * sunucudan geçmiyoruz ve gerçek zamanlı kalıyoruz.
 */

export type DisplayItem = {
  photoId: string;
  guestName: string;
  missionLabel: string;
  url: string;
};

export type FeedSnapshot = {
  items: DisplayItem[];
  frozen: boolean;
};

export function subscribeToFeed(
  eventId: string,
  onData: (snap: FeedSnapshot) => void,
  onError: (error: unknown) => void,
): () => void {
  const ref = doc(getClientDb(), `events/${eventId}/feed/live`);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData({ items: [], frozen: false });
        return;
      }
      const data = snap.data() as {
        items?: DisplayItem[];
        frozen?: boolean;
      };
      onData({
        items: Array.isArray(data.items) ? data.items : [],
        frozen: data.frozen === true,
      });
    },
    onError,
  );
}

/**
 * Fotoğrafı sahneye verilebilecek hâle getirir.
 *
 * `crossOrigin = "anonymous"` ZORUNLU, süs değil:
 * motor fotoğrafı canvas'a çizip `getImageData` ile okuyor (yaprak koptuğunda
 * parçacığa dönüşen toz efekti, final kolajı). Başka kökenden gelen bir görsel
 * canvas'ı "kirletiyor" ve `getImageData` SecurityError atıyor — yani bayrak
 * konmazsa fotoğraf görünür ama yaprak dökülme animasyonu sahnede çöker.
 * R2 tarafında CORS'un GET'e izin vermesi de bu yüzden şart.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("görsel yüklenemedi"));
    img.src = url;
  });
}
