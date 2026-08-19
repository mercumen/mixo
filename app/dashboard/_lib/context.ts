import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import type { EventDoc, UserDoc } from "@/lib/schema";
import { listMyEvents } from "./data";

/**
 * Panel sayfalarının ortak girişi: kim baktığı ve hangi etkinliğe baktığı.
 *
 * `cache` ile sarılı — layout ve sayfa aynı istekte çağırsa da Firestore'a
 * bir kez gidiliyor.
 *
 * AKTİF ETKİNLİK SEÇİMİ:
 * Eskiden "en yeni etkinlik" sabitti; kullanıcının birden fazla etkinliği
 * olduğunda diğerlerine ulaşmanın yolu yoktu. Artık seçim çerezde duruyor.
 * Çerezdeki kimlik DOĞRULANIYOR — başkasının etkinliğinin kimliğini çereze
 * yazan biri onu göremiyor, liste kullanıcının kendi etkinlikleriyle
 * kesiştiriliyor. Geçersizse en yeniye düşüyor.
 *
 * `event` NULL OLABİLİR: kullanıcının henüz etkinliği yoktur. Panelin bütün
 * sayfaları bu durumu karşılamak zorunda (boş durum basıyorlar).
 */

export const ACTIVE_EVENT_COOKIE = "mixo_active_event";

export const getDashboardContext = cache(
  async (): Promise<{
    user: UserDoc;
    event: EventDoc | null;
    /** Etkinlik seçicinin ve Organizasyonlarım sayfasının listesi */
    events: EventDoc[];
  }> => {
    const user = await getCurrentUser();
    // Layout zaten koruyor; buraya düşmesi beklenmiyor ama tip güvenliği için
    if (!user) redirect("/giris");

    const events = await listMyEvents(user.uid);
    const wanted = (await cookies()).get(ACTIVE_EVENT_COOKIE)?.value;

    const event =
      (wanted ? events.find((e) => e.id === wanted) : undefined) ??
      events[0] ??
      null;

    return { user, event, events };
  },
);
