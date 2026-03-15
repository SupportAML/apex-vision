import { getTeam } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const avatarColors = [
  "bg-emerald/15 text-emerald",
  "bg-cyan/15 text-cyan",
  "bg-violet/15 text-violet",
  "bg-amber/15 text-amber",
  "bg-rose/15 text-rose",
  "bg-emerald/15 text-emerald",
  "bg-cyan/15 text-cyan",
];

export default function TeamPage() {
  const team = getTeam();

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Team</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{team.length} people across all entities</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {team.map((member, i) => (
          <Card key={member.slug} className="card-hover border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback className={`rounded-xl text-xs font-bold ${avatarColors[i % avatarColors.length]}`}>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-bold">{member.name}</CardTitle>
                  <p className="text-[11px] text-muted-foreground">{member.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-medium">Entities</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{member.entities}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-medium">Access</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{member.access}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
