"use client";

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
import { HighscoresLevelChart } from "@/components/charts/highscores-level-chart";
import { useHighscores } from "@/lib/tibia/use-highscores";

export default function DashboardPage() {
  const { data, isLoading, isError } = useHighscores({
    world: "Antica",
    category: "experience",
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Top experience — mundo Antica
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 — Level</CardTitle>
          <CardDescription>Distribuição de level dos primeiros colocados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : isError || !data ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados.</p>
          ) : (
            <HighscoresLevelChart entries={data.entries} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highscores</CardTitle>
          <CardDescription>
            {data ? `${data.page.total_records} jogadores no total` : "Ranking de experiência"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
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
                  <TableHead className="text-right">Experiência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry) => (
                  <TableRow key={entry.rank}>
                    <TableCell>{entry.rank}</TableCell>
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
