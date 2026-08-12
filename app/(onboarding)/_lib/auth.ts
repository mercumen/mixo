"use client";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";

/**
 * Organizatör kimlik doğrulama — gerçek Firebase Auth.
 *
 * Hesap açma/giriş istemcide oluyor (Firebase Auth SDK). Ardından
 * `users/{uid}` dokümanını sunucu yaratıyor: istemcinin Firestore'a
 * yazma yetkisi yok, rolü de kendisi belirleyemiyor.
 */

/** Firebase hata kodlarını sahada okunabilir Türkçeye çeviriyor. */
function toMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-posta veya şifre hatalı.";
    case "auth/invalid-email":
      return "E-posta adresi geçersiz.";
    case "auth/email-already-in-use":
      return "Bu e-posta ile bir hesap zaten var. Giriş yapmayı deneyin.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter olmalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google penceresi kapatıldı.";
    case "auth/popup-blocked":
      return "Tarayıcı açılır pencereyi engelledi. İzin verip tekrar deneyin.";
    case "auth/operation-not-allowed":
      // Firebase Console → Authentication → Sign-in method'da sağlayıcı kapalı
      return "Bu giriş yöntemi etkin değil.";
    case "auth/network-request-failed":
      return "Bağlantı kurulamadı. İnternetinizi kontrol edin.";
    default:
      return "Bir şeyler ters gitti. Tekrar deneyin.";
  }
}

/** Hata mesajı taşıyan, arayüzde doğrudan gösterilebilir hata. */
export class AuthError extends Error {
  constructor(cause: unknown) {
    super(toMessage(cause));
    this.name = "AuthError";
  }
}

/**
 * Giriş sonrası iki iş: kullanıcı dokümanını hazırla, oturum çerezini kur.
 *
 * Çerez şart: Firebase oturumu sadece tarayıcıda duruyor, sunucu bilmiyor.
 * Çerez olmadan /dashboard sunucu tarafında korunamaz.
 */
async function establishSession(user: User, displayName?: string) {
  const idToken = await user.getIdToken();
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${idToken}`,
  };

  const bootstrapRes = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers,
    body: JSON.stringify({ displayName }),
  });
  if (!bootstrapRes.ok) {
    throw new Error("Hesap hazırlanamadı. Tekrar deneyin.");
  }

  const sessionRes = await fetch("/api/auth/session", {
    method: "POST",
    headers,
  });
  if (!sessionRes.ok) {
    throw new Error("Oturum açılamadı. Tekrar deneyin.");
  }
}

/** E-posta kayıtlı mı? Akışı giriş/kayıt kollarına ayırır. */
export async function checkEmail(email: string): Promise<{ exists: boolean }> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Kontrol edilemedi, tekrar deneyin.");
  }
  return res.json();
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  try {
    const cred = await createUserWithEmailAndPassword(
      getClientAuth(),
      input.email.trim(),
      input.password,
    );
    // Auth profilindeki isim, davet mailleri ve panel başlığında kullanılıyor
    await updateProfile(cred.user, { displayName: input.fullName.trim() });
    await establishSession(cred.user, input.fullName.trim());
  } catch (error) {
    throw error instanceof Error && error.name !== "FirebaseError"
      ? error
      : new AuthError(error);
  }
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  try {
    const cred = await signInWithEmailAndPassword(
      getClientAuth(),
      input.email.trim(),
      input.password,
    );
    await establishSession(cred.user);
  } catch (error) {
    throw error instanceof Error && error.name !== "FirebaseError"
      ? error
      : new AuthError(error);
  }
}

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(getClientAuth(), getGoogleProvider());
    await establishSession(cred.user);
  } catch (error) {
    throw error instanceof Error && error.name !== "FirebaseError"
      ? error
      : new AuthError(error);
  }
}

/**
 * Çıkış. İki tarafı da temizliyoruz: tarayıcıdaki Firebase oturumu ve
 * sunucudaki çerez. Birini atlarsak yarım oturum kalıyor.
 */
export async function signOutEverywhere() {
  await Promise.allSettled([
    signOut(getClientAuth()),
    fetch("/api/auth/session", { method: "DELETE" }),
  ]);
}

/**
 * Şifre sıfırlama maili. Firebase kendi mail altyapısıyla gönderiyor —
 * Resend'e bağlı değil, o yüzden domain beklemeden çalışıyor.
 *
 * Kayıtlı olmayan e-posta için hata FIRLATMIYORUZ: "bu e-posta kayıtlı değil"
 * demek kullanıcı numaralandırmaya kapı açar. Her durumda aynı şey söyleniyor.
 */
export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(getClientAuth(), email.trim());
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/user-not-found") return; // sessizce yut
    throw new AuthError(error);
  }
}
