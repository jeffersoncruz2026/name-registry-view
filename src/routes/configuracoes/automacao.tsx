import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, ShieldOff, XCircle } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAutomacaoCepea } from "@/hooks/useAutomacaoCepea";
import { formatarDataBr, formatarDataHoraBr } from "@/lib/cepea/numberParser";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracoes/automacao")({
  head: () => ({
    meta: [{ title: "Automação CEPEA — Cotações CEPEA Goiânia" }],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <PaginaAutomacao />
      </AppShell>
    </RequireAuth>
  ),
});

function BadgeStatusExecucao({ status }: { status: string }) {
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

function PaginaAutomacao() {
  const { data: status, isLoading, isError, error } = useAutomacaoCepea();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Automação CEPEA</h1>
        <p className="text-sm text-muted-foreground">
          Status da coleta automática das cotações da região GO-Goiânia.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          A coleta automática é executada por um agente instalado no computador autorizado. Este
          painel apenas mostra o resultado das execuções já registradas — ele não dispara nem
          controla o agente remotamente.
        </p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Erro ao carregar o status da automação: {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading || !status ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Situação dos dados</CardTitle>
                <Badge
                  className={cn(
                    "gap-1.5",
                    status.atualizado
                      ? "border-transparent bg-positivo text-primary-foreground"
                      : "border-transparent bg-amber-500 text-white",
                  )}
                >
                  {status.atualizado ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <AlertTriangle className="size-3.5" />
                  )}
                  {status.atualizado ? "Atualizado" : "Pendente"}
                </Badge>
              </div>
              <CardDescription>
                Último dia útil esperado: {formatarDataBr(status.diaUtilEsperado)} · Última cotação
                disponível: {formatarDataBr(status.ultimaDataCotacao)}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Última importação bem-sucedida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {status.ultimoSucesso ? (
                  <>
                    <p className="text-foreground">
                      {formatarDataHoraBr(status.ultimoSucesso.importado_em)}
                    </p>
                    <p className="text-muted-foreground">
                      Cotação de {formatarDataBr(status.ultimoSucesso.data_cotacao)} ·{" "}
                      {status.ultimoSucesso.quantidade_registros ?? 0} registro(s)
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Arquivo: {status.ultimoSucesso.nome_arquivo ?? "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhuma importação bem-sucedida ainda.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Último erro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {status.ultimoErro ? (
                  <>
                    <p className="flex items-center gap-1.5 text-destructive">
                      <XCircle className="size-3.5 shrink-0" />
                      {formatarDataHoraBr(status.ultimoErro.importado_em)}
                    </p>
                    <p className="text-muted-foreground">{status.ultimoErro.mensagem ?? "—"}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhum erro registrado.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico das últimas execuções</CardTitle>
              <CardDescription>
                Últimas {status.historico.length} tentativas registradas (importação manual e
                automática compartilham o mesmo histórico).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Data da cotação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Executado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {status.historico.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          Nenhuma execução registrada ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      status.historico.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {item.nome_arquivo ?? "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatarDataBr(item.data_cotacao)}
                          </TableCell>
                          <TableCell>
                            <BadgeStatusExecucao status={item.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.quantidade_registros ?? 0}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <ShieldOff className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p>
          Por segurança, este aplicativo{" "}
          <strong>nunca solicita nem armazena usuário ou senha do site da CEPEA</strong> no
          navegador. O agente autorizado se autentica na função de coleta com uma chave própria (não
          relacionada a login do CEPEA), configurada apenas no servidor.
        </p>
      </div>
    </div>
  );
}
