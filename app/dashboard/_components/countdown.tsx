"use client";

import { useEffect, useState } from "react";
import { countdownTo } from "../_lib/format";

/**
 * Etkinliğe kalan süre — dakikada bir güncelliyor.
 *
 * Neden client: sunucuda hesaplanan değer sayfa açık kaldıkça donuyor,
 * tasarımda ise canlı bir sayaç var.
 *
 * Hydration uyuşmazlığı çözümü: effect içinde state'e YAZMIYORUZ. Effect
 * sadece "şu an" damgasını ilerletiyor, süre render sırasında hesaplanıyor.
 * İlk turda `now` null olduğu için sunucudan gelen `initial` basılıyor —
 * sunucu ve istemci aynı HTML'i üretiyor.
 *
 * `initial` taze: panel dinamik render ediliyor (çerez okuyor), önbelleklenmiyor.
 */
export function Countdown({
  startsAt,
  initial,
}: {
  startsAt: string | null;
  initial: {
    days: number;
    hours: number;
    minutes: number;
    past: boolean;
    unset: boolean;
  };
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const value = now === null ? initial : countdownTo(startsAt, now);

  if (value.unset) {
    return (
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        Tarih belirlenmedi
      </p>
    );
  }

  if (value.past) {
    return (
      <p className="mt-1.5 text-[15px] font-semibold tracking-tight">
        Etkinlik tarihi geçti
      </p>
    );
  }

  return (
    <p className="mt-1.5 flex items-baseline gap-1.5">
      <span className="text-[26px] leading-none font-semibold tracking-tight">
        {value.days}
      </span>
      <span className="text-[12px] text-muted-foreground">
        gün {value.hours} sa. {value.minutes} dk
      </span>
    </p>
  );
}
