import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { formatarDataBr, formatarDataHoraBr } from "@/lib/cepea/numberParser";
import type { CepeaImportacao } from "@/lib/cepea/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [{ title: "Importações — Cotações CEPEA Goiânia" }],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <PaginaImportacoes />
      </AppShell>
    </RequireAuth>
  ),
});

function useImportacoes() {
  return useQuery({
    queryKey: ["cepea-importacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cepea_importacoes")
        .select("*")
        .order("importado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CepeaImportacao[];
    },
  });
}

function BadgeStatus({ status }: { status: string }) {
  const normalizado = status.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        normalizado === "sucesso" && "border-positivo/30 bg-positivo/10 text-positivo",
        normalizado === "erro" && "border-destructive/30 bg-destructive/10 text-destructive",
        normalizado === "parcial" && "border-amber-300 bg-amber-50 text-amber-800",
      )}
    >
      {status}
    </Badge>
  );
}

function PaginaImportacoes() {
  const importacoes = useImportacoes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Importações</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de tentativas de importação de PDFs do Compacto de Preços CEPEA.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data da cotação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Importado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importacoes.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-destructive">
                    Erro ao carregar importações: {(importacoes.error as Error).message}
                  </TableCell>
                </TableRow>
              ) : importacoes.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (importacoes.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma importação registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                importacoes.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {item.nome_arquivo ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatarDataBr(item.data_cotacao)}
                    </TableCell>
                    <TableCell>
                      <BadgeStatus status={item.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantidade_registros ?? 0}
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm text-muted-foreground">
                      {item.mensagem ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatarDataHoraBr(item.importado_em)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
