"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeUpload,
  createSession,
  fetchSession,
  requestUploadIntent,
  type GuestInfo,
  type Mission,
} from "../_lib/api";
import { compressPhoto, dataUrlToBlob, putWithRetry } from "../_lib/photo";
import {
  getProgress,
  getStoredToken,
  storeProgress,
  storeToken,
  type GuestProgress,
  type UploadRecord,
} from "../_lib/storage";
import { BottomNav, Logo, PolaroidScatter, CtaButton } from "./chrome";
import { FeedScreen } from "./feed";
import { NameScreen, SplashScreen, WelcomeScreen } from "./intro";
import { MissionScreen, RevealScreen, type MissionCardState } from "./missions";

/**
 * Misafir uygulamasının durum makinesi.
 *
 * splash → karşılama → isim → açılış (salla) → görevler ⇄ akış
 *
 * Geri gelen misafir (localStorage'da jetonu olan) girişleri atlar,
 * doğrudan görevlerine düşer. Oturum SUNUCUDA yaşıyor; localStorage sadece
 * jetonu ve görev ilerlemesini hatırlıyor — silinirse misafir "yeni" olur
 * ama hak sayacı sunucuda olduğu için fazladan fotoğraf atamaz.
 */

type Stage =
  | "yukleniyor"
  | "kapali"
  | "splash"
  | "karsilama"
  | "isim"
  | "acilis"
  | "gorevler"
  | "akis";

type WindowState = "acik" | "hazir_degil" | "baslamadi" | "bitti";

/**
 * Bu misafire dağıtılacak görevleri seç / eski seçimi onar.
 *
 * Havuzda hak sayısından fazla görev olabilir — her misafir RASTGELE bir alt
 * küme alıyor ki ekranda hep aynı üç görevin kareleri dönmesin. Seçim cihazda
 * saklanıyor; organizatör bir görevi kapatırsa buradaki liste bir sonraki
 * açılışta kendini onarıyor.
 */
function ensureProgress(
  code: string,
  missions: Mission[],
  credits: number,
  reset = false,
): GuestProgress {
  const existing = reset ? null : getProgress(code);
  const activeIds = missions.map((m) => m.id);
  const target = Math.min(Math.max(1, credits), activeIds.length);

  const ids = (existing?.missionIds ?? []).filter((id) =>
    activeIds.includes(id),
  );
  const unused = activeIds
    .filter((id) => !ids.includes(id))
    .sort(() => Math.random() - 0.5);
  while (ids.length < target && unused.length > 0) {
    ids.push(unused.pop() as string);
  }

  const progress: GuestProgress = {
    missionIds: ids,
    index: Math.min(existing?.index ?? 0, ids.length),
    uploads: existing?.uploads ?? {},
    revealed: existing?.revealed ?? false,
  };
  storeProgress(code, progress);
  return progress;
}

export function GuestApp({
  code,
  eventName,
  creditsPerGuest,
  initialWindowState,
}: {
  code: string;
  eventName: string;
  creditsPerGuest: number;
  initialWindowState: WindowState;
}) {
  const [stage, setStage] = useState<Stage>("yukleniyor");
  const [windowState, setWindowState] = useState(initialWindowState);
  /** localStorage'daki jeton — render'da depoya dokunmamak için state'te */
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<GuestProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);

  // --- açılışta oturumu geri yükle -----------------------------------------
  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken(code);

    fetchSession(code, token)
      .then((res) => {
        if (cancelled) return;
        setStoredToken(token);
        setWindowState(res.event.windowState);

        if (res.guest && token) {
          setGuest(res.guest);
          setMissions(res.missions);
          const prog = ensureProgress(code, res.missions, creditsPerGuest);
          setProgress(prog);
          setStage(prog.revealed ? "gorevler" : "acilis");
        } else if (res.event.windowState === "acik") {
          setStage("splash");
        } else {
          setStage("kapali");
        }
      })
      .catch(() => {
        // Sunucuya ulaşılamadı — SSR'dan gelen pencereyle devam
        if (cancelled) return;
        setStoredToken(token);
        setStage(initialWindowState === "acik" ? "splash" : "kapali");
      });

    return () => {
      cancelled = true;
    };
  }, [code, creditsPerGuest, initialWindowState]);

  // --- ilerlemeyi tek yerden güncelle ---------------------------------------
  const patchProgress = useCallback(
    (patch: Partial<GuestProgress>) => {
      setProgress((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        storeProgress(code, next);
        return next;
      });
    },
    [code],
  );

  const setUpload = useCallback(
    (missionId: string, record: UploadRecord) => {
      setProgress((current) => {
        if (!current) return current;
        const next = {
          ...current,
          uploads: { ...current.uploads, [missionId]: record },
        };
        storeProgress(code, next);
        return next;
      });
    },
    [code],
  );

  // --- oturum açma -----------------------------------------------------------
  async function handleJoin(name: string) {
    setBusy(true);
    setNameError(null);
    try {
      const res = await createSession(code, name);
      storeToken(code, res.guest.token);
      setGuest(res.guest);
      setMissions(res.missions);
      // Yeni oturum = temiz ilerleme (eski cihaz kaydı varsa ezilir)
      setProgress(ensureProgress(code, res.missions, creditsPerGuest, true));
      setStage("acilis");
    } catch (error) {
      setNameError(
        error instanceof Error ? error.message : "Bir şeyler ters gitti.",
      );
    } finally {
      setBusy(false);
    }
  }

  // --- fotoğraf çekimi -------------------------------------------------------
  async function handleCapture(file: File) {
    if (!guest || !progress) return;
    const missionId = progress.missionIds[progress.index];
    if (!missionId) return;

    setBusy(true);
    setMissionError(null);
    try {
      const compressed = await compressPhoto(file);
      const { photoId, uploadUrl } = await requestUploadIntent(
        code,
        guest.token,
        missionId,
      );

      try {
        await putWithRetry(uploadUrl, compressed.blob);
        await completeUpload(code, guest.token, photoId);
        setUpload(missionId, {
          photoId,
          status: "sent",
          thumb: compressed.thumb,
        });
        setGuest({
          ...guest,
          remainingCredits: Math.max(0, guest.remainingCredits - 1),
        });
      } catch {
        /**
         * PUT ya da tamamlama düştü — HAK YANMADI (kredi ancak obje R2'ye
         * inince düşüyor). Fotoğraf ve imzalı adres cihazda bekliyor,
         * "Tekrar dene" aynı adresi kullanıyor.
         */
        setUpload(missionId, {
          photoId,
          status: "failed",
          thumb: compressed.thumb,
          dataUrl: compressed.dataUrl,
          uploadUrl,
        });
        setMissionError(
          "Fotoğraf gönderilemedi. İnternetini kontrol edip tekrar dene — hakkın yanmadı.",
        );
      }
    } catch (error) {
      setMissionError(
        error instanceof Error ? error.message : "Bir şeyler ters gitti.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    if (!guest || !progress) return;
    const missionId = progress.missionIds[progress.index];
    const record = progress.uploads[missionId];
    if (!record?.dataUrl || !record.uploadUrl) return;

    setBusy(true);
    setMissionError(null);
    try {
      const blob = await dataUrlToBlob(record.dataUrl);
      await putWithRetry(record.uploadUrl, blob);
      await completeUpload(code, guest.token, record.photoId);
      setUpload(missionId, {
        photoId: record.photoId,
        status: "sent",
        thumb: record.thumb,
      });
      setGuest({
        ...guest,
        remainingCredits: Math.max(0, guest.remainingCredits - 1),
      });
    } catch (error) {
      setMissionError(
        error instanceof Error
          ? error.message
          : "Yine olmadı — biraz sonra tekrar dene.",
      );
    } finally {
      setBusy(false);
    }
  }

  // --- görev kartının durumu ---------------------------------------------------
  function missionCardState(): MissionCardState {
    if (!progress || progress.index >= progress.missionIds.length) {
      return { kind: "bitti", reason: "gorevler" };
    }
    const missionId = progress.missionIds[progress.index];
    const mission = missions.find((m) => m.id === missionId);
    const upload = progress.uploads[missionId] ?? null;

    if (!mission) return { kind: "bitti", reason: "gorevler" };
    if (!upload && guest && guest.remainingCredits <= 0) {
      return { kind: "bitti", reason: "hak" };
    }
    return { kind: "gorev", missionLabel: mission.label, upload };
  }

  // --- sekmeler ----------------------------------------------------------------
  function handleNav(tab: "gorevler" | "akis") {
    setMissionError(null);
    if (tab === "akis") {
      setStage("akis");
      return;
    }
    if (guest && progress) {
      setStage(progress.revealed ? "gorevler" : "acilis");
    } else if (windowState === "acik") {
      setStage("isim");
    }
  }

  const navFor = (active: "gorevler" | "akis") => (
    <BottomNav active={active} onSelect={handleNav} />
  );

  // --- sahneler ------------------------------------------------------------------
  switch (stage) {
    case "yukleniyor":
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <div className="animate-pulse">
            <Logo />
          </div>
        </div>
      );

    case "kapali":
      return <ClosedScreen state={windowState} onBrowseFeed={() => setStage("akis")} />;

    case "splash":
      return <SplashScreen onStart={() => setStage("karsilama")} />;

    case "karsilama":
      return (
        <WelcomeScreen
          eventName={eventName}
          onJoin={() => setStage("isim")}
          onBrowseFeed={() => setStage("akis")}
        />
      );

    case "isim":
      return (
        <NameScreen
          busy={busy}
          error={nameError}
          onSubmit={handleJoin}
          onBack={() => setStage("karsilama")}
        />
      );

    case "acilis":
      return (
        <>
          <RevealScreen
            onReveal={() => {
              patchProgress({ revealed: true });
              setStage("gorevler");
            }}
          />
          {navFor("gorevler")}
        </>
      );

    case "gorevler":
      return (
        <>
          <MissionScreen
            state={missionCardState()}
            index={progress?.index ?? 0}
            total={Math.max(1, progress?.missionIds.length ?? 1)}
            busy={busy}
            error={missionError}
            onCapture={handleCapture}
            onRetry={handleRetry}
            onDismissStatus={() => {}}
            onNext={() => {
              setMissionError(null);
              patchProgress({ index: (progress?.index ?? 0) + 1 });
            }}
            onBrowseFeed={() => setStage("akis")}
          />
          {navFor("gorevler")}
        </>
      );

    case "akis":
      return (
        <>
          <FeedScreen
            code={code}
            token={guest?.token ?? storedToken}
            onRequireJoin={() =>
              setStage(windowState === "acik" ? "isim" : "akis")
            }
          />
          {navFor("akis")}
        </>
      );
  }
}

/** Pencere kapalıyken gösterilen sakin ekran. */
function ClosedScreen({
  state,
  onBrowseFeed,
}: {
  state: WindowState;
  onBrowseFeed: () => void;
}) {
  const copy =
    state === "bitti"
      ? {
          title: "Etkinlik sona erdi",
          text: "Gecenin kareleri hâlâ akışta — göz atabilirsin.",
        }
      : state === "baslamadi"
        ? {
            title: "Henüz başlamadı",
            text: "Etkinlik saati geldiğinde görevlerin burada olacak.",
          }
        : {
            title: "Etkinlik hazırlanıyor",
            text: "Organizatör kurulumu tamamladığında bu sayfa açılacak.",
          };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PolaroidScatter />
      <header className="relative pt-12">
        <Logo />
      </header>
      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">{copy.title}</h1>
        <p className="mt-2 text-[15px] text-gray-600">{copy.text}</p>
        {state === "bitti" && (
          <div className="mt-8 w-full">
            <CtaButton onClick={onBrowseFeed}>Akışa Göz At</CtaButton>
          </div>
        )}
      </div>
    </div>
  );
}
