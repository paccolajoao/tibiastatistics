"use client";

import { useState } from "react";
import {
  Award,
  Fish,
  Flame,
  Hand,
  Medal,
  ShieldHalf,
  Skull,
  Sparkles,
  Star,
  Sword,
  Swords,
  Target,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { HighscoresLevelChart } from "@/components/charts/highscores-level-chart";
import { useHighscores } from "@/lib/tibia/use-highscores";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const WORLD = "Blumera";

const CATEGORIES = [
  { value: "experience", label: "Experiência", icon: Star, valueLabel: "Experiência" },
  { value: "magic", label: "Nível mágico", icon: Wand2, valueLabel: "Magic level" },
  { value: "fist", label: "Fist fighting", icon: Hand, valueLabel: "Skill" },
  { value: "club", label: "Club fighting", icon: Swords, valueLabel: "Skill" },
  { value: "sword", label: "Sword fighting", icon: Sword, valueLabel: "Skill" },
  { value: "axe", label: "Axe fighting", icon: Sword, valueLabel: "Skill" },
  { value: "distance", label: "Distance fighting", icon: Target, valueLabel: "Skill" },
  { value: "shielding", label: "Shielding", icon: ShieldHalf, valueLabel: "Skill" },
  { value: "fishing", label: "Fishing", icon: Fish, valueLabel: "Skill" },
  { value: "achievements", label: "Achievements", icon: Trophy, valueLabel: "Pontos" },
  { value: "loyalty", label: "Loyalty points", icon: Award, valueLabel: "Pontos" },
  { value: "charmpoints", label: "Charm points", icon: Sparkles, valueLabel: "Pontos" },
  { value: "drome", label: "Tarnished Amulets (Drome)", icon: Medal, valueLabel: "Pontos" },
  { value: "goshnarstaint", label: "Goshnar's Taint", icon: Skull, valueLabel: "Pontos" },
] as const;

function categoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xl font-semibold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [category, setCategory] = useState<string>("experience");
  const meta = categoryMeta(category);

  const { data, isLoading, isError } = useHighscores({
    world: WORLD,
    category,
  });

  const leader = data?.entries[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Highscores — mundo {WORLD}
          </p>
        </div>

        <Select value={category} onValueChange={(value) => value && setCategory(value)}>
          <SelectTrigger className="w-[220px]">
            <Flame className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-[68px]" />
          <Skeleton className="h-[68px]" />
          <Skeleton className="h-[68px]" />
        </div>
      ) : data && leader ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={Trophy} label={`Líder — ${meta.label}`} value={leader.name} />
          <StatTile
            icon={meta.icon}
            label={`${meta.valueLabel} do líder`}
            value={numberFormatter.format(leader.value)}
          />
          <StatTile
            icon={Users}
            label="Jogadores no ranking"
            value={numberFormatter.format(data.page.total_records)}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Top 10 — Level</CardTitle>
          <CardDescription>
            Distribuição de level dos primeiros colocados em {meta.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : isError || !data ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados.</p>
          ) : (
            <HighscoresLevelChart entries={data.entries} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highscores — {meta.label}</CardTitle>
          <CardDescription>
            {data ? `${data.page.total_records} jogadores no total` : "Ranking"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : isError || !data ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Vocação</TableHead>
                  <TableHead className="text-right">Level</TableHead>
                  <TableHead className="text-right">{meta.valueLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry) => (
                  <TableRow key={entry.rank}>
                    <TableCell>
                      {entry.rank <= 3 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          <Medal className="size-3.5" />
                          {entry.rank}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell>{entry.vocation}</TableCell>
                    <TableCell className="text-right">{entry.level}</TableCell>
                    <TableCell className="text-right">
                      {entry.value.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
