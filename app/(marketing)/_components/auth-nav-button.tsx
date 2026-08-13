"use client";

import { useSignedIn } from "@/app/_components/use-signed-in";
import { ButtonLink } from "./ui";

/**
 * Nav'daki kimlik düğmesi: girişsizken "Giriş Yap", girişliyken "Panelim".
 *
 * Sadece bu düğme client component — nav ve sayfanın kalanı sunucuda kalıyor,
 * landing statik önceden üretilmeye devam ediyor.
 *
 * `unknown` durumunda "Giriş Yap" gösteriyoruz: landing ziyaretçilerinin
 * büyük kısmı anonim, doğru varsayım o. Genişlik iki metinde de yakın
 * olduğu için geçiş sırasında düzen kaymıyor.
 */
export function AuthNavButton() {
  const signedIn = useSignedIn();

  return signedIn === "yes" ? (
    <ButtonLink href="/dashboard" variant="dark" size="sm">
      Panelim
    </ButtonLink>
  ) : (
    <ButtonLink href="/giris" variant="dark" size="sm">
      Giriş Yap
    </ButtonLink>
  );
}
