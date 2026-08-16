"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Görev havuzunun yazma tarafı.
 *
 * Sayfa server component olarak kalıyor (veriyi o çekiyor); sadece
 * etkileşimli parçalar burada. Değişiklikten sonra `router.refresh()`
 * çağırıyoruz: sunucu veriyi yeniden çekiyor, biz ikinci bir kopya
 * state tutmuyoruz — sayaçlar ve sıralama tek kaynaktan geliyor.
 */

/** İstek yolu tek yerden — etkinlik kimliği her çağrıda lazım. */
function missionsPath(eventId: string, missionId?: string) {
  const base = `/api/events/${eventId}/missions`;
  return missionId ? `${base}/${missionId}` : base;
}

export function AddMissionButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(missionsPath(eventId), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Görev eklenemedi.");
        setBusy(false);
        return;
      }

      setLabel("");
      setOpen(false);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Bağlanılamadı, tekrar deneyin.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" aria-hidden="true" />
        Manuel Görev Ekle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Manuel Görev Ekle</DialogTitle>
            <DialogDescription>
              Misafirlerin göreceği görev metnini yazın. Kısa ve net olsun.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mission-label">Görev</Label>
              <Input
                id="mission-label"
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Gelin ve damatla birlikte bir kare"
                maxLength={120}
              />
            </div>

            {error && (
              <p role="alert" className="text-[12.5px] text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={busy || !label.trim()}>
                {busy ? "Ekleniyor…" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Görevi misafire dağıtıma açar/kapatır. */
export function MissionToggle({
  eventId,
  missionId,
  label,
  active,
}: {
  eventId: string;
  missionId: string;
  label: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // İyimser gösterim: tık anında anahtar hareket etsin, sunucu arkadan yetişsin
  const [optimistic, setOptimistic] = useState(active);

  async function toggle(next: boolean) {
    setOptimistic(next);
    const res = await fetch(missionsPath(eventId, missionId), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    // Sunucu reddederse anahtarı geri al — yalan gösterme
    if (!res.ok) setOptimistic(!next);
    startTransition(() => router.refresh());
  }

  return (
    <Switch
      checked={optimistic}
      disabled={pending}
      onCheckedChange={(v) => void toggle(v)}
      aria-label={`${label} görevini aç/kapat`}
    />
  );
}

export function DeleteMissionButton({
  eventId,
  missionId,
  label,
}: {
  eventId: string;
  missionId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    // Geri alınamaz bir işlem: tek onay yeterli, modal kurmuyoruz
    if (!window.confirm(`"${label}" görevi silinsin mi?`)) return;

    setBusy(true);
    await fetch(missionsPath(eventId, missionId), { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      aria-label={`Sil: ${label}`}
      disabled={busy}
      onClick={() => void remove()}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

/** AI görevini onaylar (havuza alır) ya da reddeder (siler). */
export function AiReviewButtons({
  eventId,
  missionId,
  label,
}: {
  eventId: string;
  missionId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true);

    await fetch(missionsPath(eventId, missionId), {
      method: approve ? "PATCH" : "DELETE",
      ...(approve
        ? {
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ pendingApproval: false }),
          }
        : {}),
    });

    setBusy(false);
    router.refresh();
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-primary hover:bg-accent"
        aria-label={`Onayla: ${label}`}
        disabled={busy}
        onClick={() => void decide(true)}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-destructive"
        aria-label={`Reddet: ${label}`}
        disabled={busy}
        onClick={() => void decide(false)}
      >
        <X className="size-3.5" />
      </Button>
    </span>
  );
}
