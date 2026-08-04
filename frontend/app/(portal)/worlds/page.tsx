"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Globe, MapPin, Search, Swords, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorldAverageChart } from "@/components/charts/world-average-chart";
import { WorldHourlyHeatmap } from "@/components/charts/world-hourly-heatmap";
import { WorldHourlyLineChart } from "@/components/charts/world-hourly-line-chart";
import { useWorldAverages, type WorldAveragesPeriod } from "@/lib/worlds/use-world-averages";
import { useWorldHourly } from "@/lib/worlds/use-world-hourly";

type SortKey = "world_name" | "avg_players_online" | "min_players_online" | "max_players_online";
type SortDir = "asc" | "desc";

const REGIONS = [
  { value: "", label: "Todas as regiões" },
  { value: "South America", label: "South America" },
  { value: "North America", label: "North America" },
];

const PVP_TYPES = [
  { value: "", label: "Todos os PvP" },
  { value: "Optional PvP", label: "Optional PvP" },
  { value: "Open PvP", label: "Open PvP" },
];

function pvpBadgeVariant(pvpType: string): "default" | "secondary" {
  return pvpType === "Open PvP" ? "default" : "secondary";
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

export default function WorldsPage() {
  const [period, setPeriod] = useState<WorldAveragesPeriod>(7);
  const [region, setRegion] = useState("");
  const [pvpType, setPvpType] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("avg_players_online");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  const { data, isLoading, isError } = useWorldAverages(period, {
    location: region,
    pvp_type: pvpType,
  });

  const {
    data: hourlyData,
    isLoading: isHourlyLoading,
    isError: isHourlyError,
  } = useWorldHourly(period, selectedWorld ?? undefined, {
    location: region,
    pvp_type: pvpType,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    const rows = query
      ? data.filter((entry) => entry.world_name.toLowerCase().includes(query))
      : data;

    const sorted = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "world_name") {
        return a.world_name.localeCompare(b.world_name) * dir;
      }
      return (a[sortKey] - b[sortKey]) * dir;
    });

    return sorted;
  }, [data, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Globe className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Worlds</h1>
          <p className="text-sm text-muted-foreground">
            Jogadores online — mundos South America e North America (Optional PvP / Open PvP)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={String(period)}
          onValueChange={(value) => setPeriod(Number(value) as WorldAveragesPeriod)}
        >
          <TabsList>
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="14">14 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={region} onValueChange={(value) => setRegion(value ?? "")}>
          <SelectTrigger className="w-[180px]">
            <MapPin className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Região" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((option) => (
              <SelectItem key={option.value || "all"} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pvpType} onValueChange={(value) => setPvpType(value ?? "")}>
          <SelectTrigger className="w-[160px]">
            <Swords className="size-4 text-muted-foreground" />
            <SelectValue placeholder="PvP" />
          </SelectTrigger>
          <SelectContent>
            {PVP_TYPES.map((option) => (
              <SelectItem key={option.value || "all"} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar mundo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Média de jogadores online por mundo</CardTitle>
          <CardDescription>
            Período de {period} dias — coletado a cada 15 minutos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : isError || !data ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há dados suficientes para este período.
            </p>
          ) : (
            <WorldAverageChart averages={filtered} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Horário mais cheio / mais vazio</CardTitle>
              <CardDescription>
                {selectedWorld
                  ? `Média por hora do dia — ${selectedWorld} (UTC)`
                  : "Média por hora do dia — todos os mundos filtrados (UTC)"}
              </CardDescription>
            </div>
            {selectedWorld ? (
              <Button variant="outline" size="sm" onClick={() => setSelectedWorld(null)}>
                <X className="size-3.5" />
                Limpar seleção
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isHourlyLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : isHourlyError || !hourlyData ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados.</p>
          ) : selectedWorld ? (
            <WorldHourlyLineChart points={hourlyData} />
          ) : (
            <WorldHourlyHeatmap points={hourlyData} onSelectWorld={setSelectedWorld} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mundos</CardTitle>
          <CardDescription>{filtered.length} mundos</CardDescription>
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
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("world_name")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Mundo <SortIcon active={sortKey === "world_name"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>PvP</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("avg_players_online")}
                      className="ml-auto flex items-center gap-1 hover:text-foreground"
                    >
                      Média <SortIcon active={sortKey === "avg_players_online"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("min_players_online")}
                      className="ml-auto flex items-center gap-1 hover:text-foreground"
                    >
                      Mín <SortIcon active={sortKey === "min_players_online"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("max_players_online")}
                      className="ml-auto flex items-center gap-1 hover:text-foreground"
                    >
                      Máx <SortIcon active={sortKey === "max_players_online"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Amostras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow
                    key={entry.world_name}
                    onClick={() => setSelectedWorld(entry.world_name)}
                    data-state={selectedWorld === entry.world_name ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{entry.world_name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {entry.location}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pvpBadgeVariant(entry.pvp_type)}>{entry.pvp_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(entry.avg_players_online)}
                    </TableCell>
                    <TableCell className="text-right">{entry.min_players_online}</TableCell>
                    <TableCell className="text-right">{entry.max_players_online}</TableCell>
                    <TableCell className="text-right">{entry.sample_count}</TableCell>
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
