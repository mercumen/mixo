"use client";

import { useEffect, useRef, useState } from "react";
import { createGarden } from "../_lib/garden-engine";
import { loadImage, subscribeToFeed } from "../_lib/feed-source";

/**
 * Ekran uygulaması — Anı Bahçesi sahnesi + gerçek fotoğraf akışı.
 *
 * SAHA KISITLARI (CLAUDE.md) burada karşılanıyor:
 *   - Wake Lock: laptop gece boyunca uyumasın
 *   - imleç ve kontroller gizli; fare oynayınca kısa süre görünüyor
 *   - internet kesilirse sahne son fotoğraflarla dönmeye DEVAM ediyor
 *     (yüklenmiş dokular GPU'da; listener koptuğunda sahne durmuyor)
 *   - gecikme tamponu: onaylanan kare ekrana hemen düşmüyor
 *   - "ekranı dondur" acil butonu: feed'deki `frozen` bayrağı yeni kare almıyor
 */

/** THREE bu adresten geliyor; demo da aynı sürümü kullanıyor. */
const THREE_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.147.0/three.min.js";

/**
 * Onaydan ekrana gecikme.
 *
 * CLAUDE.md: ekranda ayarlanabilir bir gecikme tamponu var. Sebebi acil
 * durum: organizatör kötü bir kareyi ekrana düşmeden önce reddedebilsin.
 */
const DELAY_MS = 10_000;

type GardenApi = ReturnType<typeof createGarden>;

export function GardenStage({
  eventId,
  finaleName,
}: {
  eventId: string;
  finaleName: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gardenRef = useRef<GardenApi | null>(null);
  /** Sahneye verilmiş fotoğraflar — aynı kare iki kez yaprak olmasın. */
  const seenRef = useRef<Set<string>>(new Set());
  const frozenRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [status, setStatus] = useState<"yukleniyor" | "hazir" | "hata">(
    "yukleniyor",
  );
  const [chromeVisible, setChromeVisible] = useState(true);

  // --- THREE'yi yükle, sahneyi kur ------------------------------------------
  useEffect(() => {
    let cancelled = false;

    function boot() {
      if (cancelled || !hostRef.current) return;
      try {
        gardenRef.current = createGarden(hostRef.current);
        setStatus("hazir");
      } catch {
        setStatus("hata");
      }
    }

    if (typeof window !== "undefined" && window.THREE) {
      boot();
    } else {
      const script = document.createElement("script");
      script.src = THREE_CDN;
      script.async = true;
      script.onload = boot;
      // Sahne motoru gelmezse siyah ekran değil, okunur bir mesaj görünsün
      script.onerror = () => !cancelled && setStatus("hata");
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      gardenRef.current?.dispose();
      gardenRef.current = null;
    };
  }, []);

  // --- feed'i dinle, yeni kareleri sahneye ver ------------------------------
  useEffect(() => {
    if (status !== "hazir") return;

    const unsubscribe = subscribeToFeed(
      eventId,
      ({ items, frozen }) => {
        frozenRef.current = frozen;

        // Feed en yeniden eskiye geliyor; sahneye eskiden yeniye veriyoruz ki
        // gülün yaprak sırası gerçek zaman sırasını izlesin.
        const fresh = items
          .filter((i) => !seenRef.current.has(i.photoId))
          .reverse();

        for (const item of fresh) {
          // Hemen işaretliyoruz: bir sonraki snapshot aynı kareyi tekrar
          // kuyruğa atmasın (yükleme sürerken snapshot gelebilir).
          seenRef.current.add(item.photoId);

          const timer = setTimeout(() => {
            // Dondurma anında bekleyen kareler de girmiyor
            if (frozenRef.current) return;
            loadImage(item.url)
              .then((img) => gardenRef.current?.addImage(img))
              .catch(() => {
                // İmzalı adres süresi geçmiş ya da bağlantı koptu.
                // Tekrar denenebilsin diye işareti geri alıyoruz.
                seenRef.current.delete(item.photoId);
              });
          }, DELAY_MS);

          timersRef.current.push(timer);
        }
      },
      () => {
        /**
         * Listener koptu (internet gitti). Sahneyi DURDURMUYORUZ — yüklenmiş
         * yapraklar dönmeye devam ediyor. Firestore SDK'sı bağlantıyı kendisi
         * geri kuruyor, kopuk sürede eklenen kareler döndüğünde geliyor.
         */
      },
    );

    return unsubscribe;
  }, [eventId, status]);

  // --- laptop uyumasın ------------------------------------------------------
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        // Tarayıcı vermedi (HTTP ya da destek yok) — sahne yine çalışıyor,
        // sadece ekran koruyucu riski var. Operatör uyarısı: yayına almadan
        // önce laptop güç ayarlarını "hiç uyumasın" yap.
      }
    }
    void acquire();

    // Sekme arkaya alınıp öne gelince kilit düşüyor, geri alıyoruz
    function onVisible() {
      if (document.visibilityState === "visible" && !released) void acquire();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);

  // --- imleç ve kontroller: hareket yoksa kaybol ----------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function wake() {
      setChromeVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setChromeVisible(false), 3000);
    }
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  return (
    <div
      className="garden-root"
      data-chrome={chromeVisible ? "on" : "off"}
      ref={hostRef}
    >
      {/* Sayaç: motor buraya yazıyor (#count), demo'daki yerinde duruyor */}
      <header className="garden-counter">
        <b id="count">0</b>
        <span>anı paylaşıldı</span>
      </header>

      {status === "hata" && (
        <div className="garden-error">
          <p>Sahne yüklenemedi.</p>
          <span>İnternet bağlantısını kontrol edip sayfayı yenileyin.</span>
        </div>
      )}

      {/* Operatör kontrolleri: fare oynamazsa kayboluyor, misafir görmüyor */}
      <div className="garden-chrome">
        <button type="button" onClick={toggleFullscreen}>
          Tam ekran
        </button>
        <button
          type="button"
          onClick={() => gardenRef.current?.showFinale(finaleName)}
        >
          Finali başlat
        </button>
      </div>
    </div>
  );
}
