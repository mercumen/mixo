"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { publicEnv } from "@/lib/env";

/**
 * Firebase istemci SDK'sı — tarayıcı tarafı.
 *
 * İki iş için var:
 *   1. Organizatör girişi (e-posta/şifre + Google)
 *   2. Realtime listener — ekran `events/{id}/feed/live` dokümanını dinliyor
 *
 * Bu SDK Security Rules'a TABİDİR. Yazma yetkisi yok denecek kadar az;
 * veri değiştiren her şey sunucu endpoint'lerinden geçiyor.
 *
 * Firebase Analytics BİLEREK yok:
 *   - `getAnalytics` SSR'da patlar (window gerektirir)
 *   - misafir uygulaması hafif olmak zorunda (mekan wifi'si yok, 4G var)
 *   - KVKK tarafında gereksiz bir izleme/rıza katmanı açıyor
 */

function getClientApp() {
  return getApps().length > 0 ? getApp() : initializeApp(publicEnv.firebase);
}

export function getClientAuth() {
  return getAuth(getClientApp());
}

export function getClientDb() {
  return getFirestore(getClientApp());
}

/** Tasarımdaki "Google ile Devam Et" düğmesi bunu kullanacak. */
export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  // Hesap seçme ekranı her seferinde çıksın — ortak kullanılan
  // organizatör laptoplarında yanlış hesapla giriş olmasın.
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
