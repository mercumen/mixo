"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deletePhoto, fetchFeed, sendLike, type FeedItem } from "../_lib/api";
import { getLikedIds, storeLikedIds } from "../_lib/storage";

/**
 * Canlı Akış — "En Beğenilenler".
 *
 * Sunucu tek feed dokümanını okuyup dönüyor (istek başına 2 okuma), biz de
 * 25 saniyede bir tazeliyoruz. Firestore dinleyicisi BİLEREK yok: 500 misafir
 * telefonundan canlı dinleyici açsa kota gecenin ortasında biterdi —
 * o ayrıcalık yalnızca ekranın (CLAUDE.md kural 2).
 *
 * Beğeni iyimser: kalp anında dolar, istek arkadan gider. Kimin neyi
 * beğendiği cihazda (localStorage) — bkz. /api/guest/like.
 */

const REFRESH_MS = 25_000;

export function FeedScreen({
  code,
  token,
  onRequireJoin,
}: {
  code: string;
  token: string | null;
  /** Oturumu olmayan kalbe basarsa isim ekranına gidiyor */
  onRequireJoin: () => void;
}) {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  /**
   * localStorage'dan lazy init güvenli: bu ekran hiç sunucuda çizilmiyor
   * (durum makinesi onu ancak istemcide açıyor), hydration uyuşmazlığı yok.
   */
  const [liked, setLiked] = useState<Set<string>>(() => getLikedIds(code));

  const refresh = useCallback(async () => {
    try {
      const { items } = await fetchFeed(code, token);
      setItems(items);
    } catch {
      // Akış tazelenemedi — eldeki kareler dursun, bir sonraki tur dener
    }
  }, [code, token]);

  useEffect(() => {
    // İlk yükleme de zamanlayıcıyla: effect gövdesinde senkron setState yok
    const kick = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(kick);
      clearInterval(timer);
    };
  }, [refresh]);

  function toggleLike(item: FeedItem) {
    if (!token) {
      onRequireJoin();
      return;
    }
    const wasLiked = liked.has(item.photoId);

    const next = new Set(liked);
    if (wasLiked) next.delete(item.photoId);
    else next.add(item.photoId);
    setLiked(next);
    storeLikedIds(code, next);

    setItems(
      (current) =>
        current?.map((i) =>
          i.photoId === item.photoId
            ? { ...i, likes: Math.max(0, i.likes + (wasLiked ? -1 : 1)) }
            : i,
        ) ?? null,
    );

    // İyimser: istek arkadan; patlarsa dünyanın sonu değil, sayaç sunucuda
    void sendLike(code, token, item.photoId, !wasLiked).catch(() => {});
  }

  async function removeOwn(item: FeedItem) {
    if (!token) return;
    // Geri dönüşü yok (KVKK silme) — tek adımlık onay şart
    if (!window.confirm("Bu fotoğraf kalıcı olarak silinsin mi?")) return;

    setItems((current) =>
      current?.filter((i) => i.photoId !== item.photoId) ?? null,
    );
    try {
      await deletePhoto(code, token, item.photoId);
    } catch {
      void refresh(); // silinemedi — kareyi geri getir
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden pb-32">
      {/* Başlık: "Canlı Akış" + arkada dev soluk "En Beğenilenler" */}
      <header className="relative h-28 overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap text-[44px] font-extrabold text-gray-900/5"
        >
          En Beğenilenler
        </span>
        <h1 className="relative pt-8 text-center text-[22px] font-extrabold text-gray-900">
          Canlı Akış
        </h1>
      </header>

      <div className="relative px-4">
        {items === null ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-gray-500">
            Henüz onaylanmış fotoğraf yok.
            <br />
            İlk kareyi sen gönder!
          </p>
        ) : (
          <div className="columns-2 gap-3">
            {items.map((item) => (
              <FeedCard
                key={item.photoId}
                item={item}
                liked={liked.has(item.photoId)}
                onLike={() => toggleLike(item)}
                onDelete={() => removeOwn(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({
  item,
  liked,
  onLike,
  onDelete,
}: {
  item: FeedItem;
  liked: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mb-3 break-inside-avoid rounded-2xl bg-white p-2.5 shadow-[0_4px_18px_rgba(20,10,50,0.07)]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- süreli imzalı R2 adresi, next/image optimizasyonuna giremez */}
        <img
          src={item.url}
          alt={item.missionLabel || "Etkinlik fotoğrafı"}
          loading="lazy"
          className="w-full rounded-xl object-cover"
        />
        {item.mine && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Fotoğrafımı sil"
            className="absolute right-2 top-2 rounded-lg bg-white/85 p-1.5 text-gray-700 shadow-sm backdrop-blur"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-2 px-0.5 text-sm font-bold text-violet-600">
        {item.guestName}
      </p>
      {item.missionLabel && (
        <p className="px-0.5 text-sm leading-snug text-gray-800">
          {item.missionLabel}
        </p>
      )}

      <button
        type="button"
        onClick={onLike}
        className="mt-1.5 flex items-center gap-1.5 px-0.5 py-1 text-sm text-gray-600"
      >
        <Heart
          className={cn(
            "h-4.5 w-4.5",
            liked ? "fill-violet-600 text-violet-600" : "text-gray-500",
          )}
        />
        <span className="font-medium">{item.likes}</span>
      </button>
    </div>
  );
}

/** İlk yüklemede boş gri kartlar — zıplamadan dolsun. */
function FeedSkeleton() {
  return (
    <div className="columns-2 gap-3">
      {[180, 120, 140, 200].map((h, i) => (
        <div
          key={i}
          className="mb-3 break-inside-avoid rounded-2xl bg-white p-2.5 shadow-sm"
        >
          <div
            className="w-full animate-pulse rounded-xl bg-gray-100"
            style={{ height: h }}
          />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
