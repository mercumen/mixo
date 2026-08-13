"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getClientAuth } from "@/lib/firebase/client";

/**
 * Kullanıcı giriş yapmış mı? — İSTEMCİDE.
 *
 * NEDEN SUNUCUDA DEĞİL: pazarlama sayfaları statik olarak önceden üretiliyor
 * (SEO ve hız için). Sunucuda çerez okumak sayfayı dinamiğe çevirirdi.
 * Statik HTML herkese aynı gittiği için kişiselleştirme istemcide olmak zorunda.
 *
 * Oturum çerezi httpOnly, yani JS okuyamıyor. Bunun yerine Firebase istemci
 * SDK'sının kendi kalıcılığını kullanıyoruz (IndexedDB) — ek ağ isteği yok.
 *
 * "unknown" durumu önemli: ilk render'da henüz bilmiyoruz. Arayüz o sırada
 * anonim varsayımıyla çiziliyor (landing ziyaretçilerinin büyük kısmı öyle),
 * bilgi gelince değişiyor. Kısa bir geçiş oluyor, statik sayfada kaçınılmaz.
 *
 * Not: Firebase'in yerel oturumu ile sunucudaki çerez ayrışabilir (çerez
 * süresi geçmiş ama IndexedDB'de kullanıcı duruyor olabilir). O durumda düğme
 * "Panelim" der, tıklayınca panel /giris'e atar — kendi kendini düzeltiyor.
 * Güvenlik buna dayanmıyor, panel çerezi kendisi doğruluyor.
 */
export type SignedInState = "unknown" | "yes" | "no";

export function useSignedIn(): SignedInState {
  const [state, setState] = useState<SignedInState>("unknown");

  useEffect(() => {
    // setState abonelik geri çağrısının içinde — effect gövdesinde değil
    return onAuthStateChanged(getClientAuth(), (user) => {
      setState(user ? "yes" : "no");
    });
  }, []);

  return state;
}
