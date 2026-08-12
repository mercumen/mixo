import { Mail, UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NoEventState } from "../_components/empty-state";
import { getDashboardContext } from "../_lib/context";
import { PageHeader, SectionHeading } from "../_components/ui-bits";
import { pendingInvites, teamMembers } from "../_lib/mock";

/** İsimden baş harfler — profil fotoğrafı gelmediği için. */
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function TeamPage() {
  const { event } = await getDashboardContext();

  // Panelin bütün sayfaları etkinlik bağlamına dayanıyor
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={"Ekip"}
          description={"Etkinliği birlikte yönetin"}
        />
        <NoEventState what={"Ekibi"} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ekip"
        description="Etkinliği birlikte yönetin"
        actions={
          <Button size="sm">
            <UserPlus className="size-3.5" aria-hidden="true" />
            Üye Davet Et
          </Button>
        }
      />

      <Card className="gap-0 p-5">
        <SectionHeading
          title={`Üyeler (${teamMembers.length})`}
          description="Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."
        />
        <ul className="mt-4 divide-y divide-border">
          {teamMembers.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3.5">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-accent text-[11px] font-medium text-accent-foreground">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[12.5px] font-semibold">
                  <span className="min-w-0 truncate">{member.name}</span>
                  {member.owner ? (
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-accent text-[10.5px] text-accent-foreground"
                    >
                      Sahip
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {member.joinedLabel}
              </span>
              {/* Sahip çıkarılamaz — tek yönetici kalmasın diye */}
              {member.owner ? (
                <span aria-hidden="true" className="w-7 shrink-0" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Ekipten çıkar: ${member.name}`}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="gap-0 p-5">
        <SectionHeading
          title={`Bekleyen Davetler (${pendingInvites.length})`}
          description="Misafirlerin göreceği tüm görevleri yönetin, AI ile yenilerini üretin."
        />
        <ul className="mt-4 divide-y divide-border">
          {pendingInvites.map((invite) => (
            <li key={invite.id} className="flex items-center gap-3 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border">
                <Mail className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium">{invite.email}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {invite.sentLabel} •{" "}
                  <span className={invite.expiringSoon ? "text-destructive" : undefined}>
                    {invite.expiresLabel}
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 text-[12px]">
                Yeniden Gönder
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Daveti iptal et: ${invite.email}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
