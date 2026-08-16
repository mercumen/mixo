import { GripVertical, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MissionDoc } from "@/lib/schema";
import { NoEventState } from "../_components/empty-state";
import { getDashboardContext } from "../_lib/context";
import { listMissions, missionStats } from "../_lib/data";
import { eventTypeLabel } from "../_lib/format";
import { PageHeader, SectionHeading, StatTile } from "../_components/ui-bits";
import {
  AddMissionButton,
  AiReviewButtons,
  DeleteMissionButton,
  MissionToggle,
} from "./_components/mission-controls";

/** Panelde "Kaynak" kolonunda görünen etiketler. */
const sourceLabels: Record<MissionDoc["source"], string> = {
  sablon: "Şablon",
  manuel: "Manuel",
  ai: "AI",
};

export default async function TasksPage() {
  const { event } = await getDashboardContext();

  // Panelin bütün sayfaları etkinlik bağlamına dayanıyor
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={"Görevler"}
          description={"Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."}
        />
        <NoEventState what={"Görev havuzunu"} />
      </div>
    );
  }

  const missions = await listMissions(event.id);
  const stats = missionStats(missions);
  const pendingAi = missions.filter((m) => m.pendingApproval);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görevler"
        description="Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."
        actions={
          <>
            <AddMissionButton eventId={event.id} />
            {/* AI üretimi henüz bağlı değil (OpenAI + paket kısıtı ayrı iş) */}
            <Button size="sm" disabled title="Yakında">
              AI ile Görev Üret
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <EngineCard themeLabel={eventTypeLabel(event.typeId)} subject={event.name} />

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Toplam Görev" value={stats.total} />
            <StatTile label="Aktif Görev" value={stats.active} />
            <StatTile label="Toplam Tamamlanma" value={stats.completions} />
            <StatTile label="Onay Bekleyen (AI)" value={stats.pendingAi} accent />
          </div>

          {/* Onay kuyruğu sadece bekleyen AI görevi varken görünüyor.
              Şablondan kopyalanan görevler onaylı doğuyor. */}
          {pendingAi.length > 0 ? (
            <PendingAiCard missions={pendingAi} eventId={event.id} />
          ) : null}
        </div>
      </div>

      <TaskTable missions={missions} eventId={event.id} />
    </div>
  );
}

function EngineCard({
  themeLabel,
  subject,
}: {
  themeLabel: string;
  subject: string;
}) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-accent">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        </span>
        <h2 className="text-[13px] font-semibold tracking-tight">
          AI Görev Motoru
        </h2>
      </div>

      <dl className="mt-5 space-y-3.5">
        <div>
          <dt className="text-[11px] text-muted-foreground">Aktif Tema</dt>
          <dd className="mt-1">
            <Badge
              variant="secondary"
              className="bg-accent text-[11px] font-medium text-accent-foreground"
            >
              {themeLabel}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Kişi / Kurum</dt>
          <dd className="mt-0.5 text-[12.5px]">{subject}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Görev Tonu</dt>
          {/* Ton kurulum sihirbazının Görev Havuzu adımında seçiliyor */}
          <dd className="mt-0.5 text-[12.5px] text-muted-foreground">
            Henüz belirlenmedi
          </dd>
        </div>
      </dl>

      <Button className="mt-5 w-full" size="sm" disabled>
        Görev Havuzu Ayarlarını Düzenle
      </Button>
    </Card>
  );
}

function PendingAiCard({
  missions,
  eventId,
}: {
  missions: MissionDoc[];
  eventId: string;
}) {
  return (
    <Card className="gap-0 p-4">
      <SectionHeading
        title={`Onay Bekleyen AI Görevleri (${missions.length})`}
        description="Canlıya almadan önce son adımlar"
      />

      <ul className="mt-4 divide-y divide-border">
        {missions.map((mission) => (
          <li key={mission.id} className="flex items-center gap-3 py-2.5">
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[12.5px]">
              {mission.label}
            </span>
            <AiReviewButtons
              eventId={eventId}
              missionId={mission.id}
              label={mission.label}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TaskTable({
  missions,
  eventId,
}: {
  missions: MissionDoc[];
  eventId: string;
}) {
  return (
    <div>
      <SectionHeading
        title="Görev Listesi"
        description="Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."
      />
      <Card className="mt-4 gap-0 overflow-hidden p-0">
        {/* Dar ekranda kolonlar sıkışmasın: min-w tabloyu kapsayıcıdan geniş
            tutuyor, taşan kısım yatay kaydırılıyor */}
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11.5px]">Görev</TableHead>
                <TableHead className="w-[110px] text-[11.5px]">Kaynak</TableHead>
                <TableHead className="w-[90px] text-[11.5px]">Durum</TableHead>
                <TableHead className="w-[130px] text-[11.5px]">Tamamlanma</TableHead>
                <TableHead className="w-[60px]">
                  <span className="sr-only">İşlemler</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-[12.5px]">
                    <span className="flex items-center gap-2">
                      {/* Sürükle-bırak sırası tasarımda var; davranış henüz yok */}
                      <GripVertical
                        className="size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">{task.label}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        task.source === "ai"
                          ? "bg-accent text-[11px] text-accent-foreground"
                          : "bg-muted text-[11px] text-muted-foreground"
                      }
                    >
                      {sourceLabels[task.source]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <MissionToggle
                      eventId={eventId}
                      missionId={task.id}
                      label={task.label}
                      active={task.active}
                    />
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {task.completions} kez
                  </TableCell>
                  <TableCell>
                    <DeleteMissionButton
                      eventId={eventId}
                      missionId={task.id}
                      label={task.label}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
