"use client";

import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mozaik referansı yükleyici — logo ya da referans fotoğraf.
 *
 * AKIŞ (CLAUDE.md kural 1: byte'lar sunucudan geçmiyor):
 *   1. sunucudan imzalı PUT adresi al
 *   2. dosyayı DOĞRUDAN R2'ye PUT et
 *   3. sunucuya "bitti" de → sunucu HEAD ile doğrulayıp etkinliğe yazıyor
 *
 * Boyut/en-boy kontrolü istemcide yapılıyor çünkü sunucu dosyayı görmüyor.
 * Sunucu tarafında da HEAD ile byte kontrolü var — istemciye güvenmiyoruz,
 * ama "600×600'den küçük" gibi kontroller ancak burada yapılabiliyor.
 */

const ACCEPT = "image/png,image/jpeg,image/webp";

const MAX_BYTES = 8 * 1024 * 1024;
const MIN_EDGE = 600;

type Status =
  | { kind: "idle" }
  | { kind: "busy"; label: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

/** Görselin en/boyunu okur — mozaik için yeterince büyük mü? */
function readDimensions(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function ReferenceUpload({
  eventId,
  kind,
  hasFile,
  onUploaded,
  variant = "outline",
}: {
  eventId: string;
  kind: "logo" | "foto";
  hasFile: boolean;
  onUploaded: () => void;
  variant?: "outline" | "default";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", message: "Dosya 8 MB'ı aşıyor." });
      return;
    }

    const dims = await readDimensions(file);
    if (!dims) {
      setStatus({ kind: "error", message: "Görsel okunamadı." });
      return;
    }
    if (dims.width < MIN_EDGE || dims.height < MIN_EDGE) {
      setStatus({
        kind: "error",
        message: `En az ${MIN_EDGE}×${MIN_EDGE} px olmalı (bu ${dims.width}×${dims.height}).`,
      });
      return;
    }

    try {
      setStatus({ kind: "busy", label: "Hazırlanıyor…" });
      const permit = await fetch("/api/uploads/stage-reference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, kind, contentType: file.type }),
      });
      if (!permit.ok) {
        const body = await permit.json().catch(() => null);
        throw new Error(body?.error ?? "Yükleme başlatılamadı.");
      }
      const { url, key } = await permit.json();

      setStatus({ kind: "busy", label: "Yükleniyor…" });
      /**
       * Doğrudan R2'ye — sunucumuz araya girmiyor.
       *
       * SADECE `content-type` gönderiliyor. Cache-Control'ü buradan
       * göndermek CORS'un `AllowedHeaders` listesine bağımlılık yaratıyordu;
       * o header'ı yükleme doğrulandıktan sonra sunucu yazıyor.
       */
      const put = await fetch(url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Dosya yüklenemedi.");

      setStatus({ kind: "busy", label: "Doğrulanıyor…" });
      const confirm = await fetch("/api/uploads/stage-reference", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, kind, key }),
      });
      if (!confirm.ok) {
        const body = await confirm.json().catch(() => null);
        throw new Error(body?.error ?? "Doğrulanamadı.");
      }

      setStatus({ kind: "done" });
      onUploaded();
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Yüklenemedi.",
      });
    }
  }

  const busy = status.kind === "busy";
  const uploaded = status.kind === "done" || (hasFile && status.kind === "idle");

  return (
    <div className="shrink-0 text-right">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Aynı dosyayı tekrar seçebilmek için input'u sıfırlıyoruz
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? status.label : uploaded ? "Değiştir" : "Dosya Seç"}
      </Button>

      {uploaded && !busy ? (
        <p className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-medium text-primary">
          <Check className="size-3" aria-hidden="true" />
          Yüklendi
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p
          role="alert"
          className={cn(
            "mt-1.5 max-w-[220px] text-[11px] leading-snug text-destructive",
          )}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

/** Yükleme kutusunun ikonu — iki yerde aynı. */
export function UploadIcon() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card">
      <Upload className="size-4 text-primary" aria-hidden="true" />
    </span>
  );
}
