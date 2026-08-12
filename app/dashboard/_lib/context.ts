import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import type { EventDoc, UserDoc } from "@/lib/schema";
import { getActiveEvent } from "./data";

/**
 * Panel sayfalarının ortak girişi: kim baktığı ve hangi etkinliğe baktığı.
 *
 * `cache` ile sarılı — layout ve sayfa aynı istekte çağırsa da Firestore'a
 * bir kez gidiliyor.
 *
 * `event` NULL OLABİLİR: kullanıcının henüz etkinliği yoktur. Panelin bütün
 * sayfaları etkinlik bağlamına dayandığı için her biri bu durumu karşılamak
 * zorunda (boş durum basıyorlar).
 */
export const getDashboardContext = cache(
  async (): Promise<{ user: UserDoc; event: EventDoc | null }> => {
    const user = await getCurrentUser();
    // Layout zaten koruyor; buraya düşmesi beklenmiyor ama tip güvenliği için
    if (!user) redirect("/giris");

    const event = await getActiveEvent(user.uid);
    return { user, event };
  },
);
