import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatarDataBr,
  formatarDataHoraBr,
  formatarNumeroBr,
  formatarPercentualBr,
} from "@/lib/cepea/numberParser";
import type { CepeaCotacao } from "@/lib/cepea/types";
import { TAMANHO_PAGINA } from "@/hooks/useCepeaCotacoes";

const COLUNAS_NUMERICAS: { chave: keyof CepeaCotacao; rotulo: string; percentual?: boolean }[] = [
  { chave: "valor_vista", rotulo: "Vst(1)" },
  { chave: "variacao_dia_vista", rotulo: "VarDiaV(1)", percentual: true },
  { chave: "minimo_vista", rotulo: "MinV(2)" },
  { chave: "maximo_vista", rotulo: "MaxV(3)" },
  { chave: "valor_prazo_30d", rotulo: "Prz(4)Ref30d" },
  { chave: "variacao_dia_prazo", rotulo: "VarDiaP(4)", percentual: true },
  { chave: "minimo_prazo_30d", rotulo: "MinP(5)Ref30d" },
  { chave: "maximo_prazo_30d", rotulo: "MaxP(6)Ref30d" },
  { chave: "prazo_medio_pagamento", rotulo: "Pmp(7)" },
  { chave: "taxa_cdi_mensal", rotulo: "CDI Mensal", percentual: true },
];

export function CotacoesTable({
  linhas,
  total,
  pagina,
  onPaginaChange,
  carregando,
  erro,
}: {
  linhas: CepeaCotacao[];
  total: number;
  pagina: number;
  onPaginaChange: (pagina: number) => void;
  carregando: boolean;
  erro: string | null;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Produto</TableHead>
              {COLUNAS_NUMERICAS.map((coluna) => (
                <TableHead key={String(coluna.chave)} className="text-right">
                  {coluna.rotulo}
                </TableHead>
              ))}
              <TableHead>Arquivo</TableHead>
              <TableHead>Importado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {erro ? (
              <TableRow>
                <TableCell colSpan={15} className="py-10 text-center text-sm text-destructive">
                  Erro ao carregar cotações: {erro}
                </TableCell>
              </TableRow>
            ) : carregando ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 15 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma cotação encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((linha) => (
                <TableRow key={linha.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatarDataBr(linha.data_cotacao)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{linha.regiao}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{linha.produto}</TableCell>
                  {COLUNAS_NUMERICAS.map((coluna) => {
                    const valor = linha[coluna.chave] as number | null;
                    return (
                      <TableCell key={String(coluna.chave)} className="text-right tabular-nums">
                        {coluna.percentual ? formatarPercentualBr(valor) : formatarNumeroBr(valor)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                    {linha.nome_arquivo ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatarDataHoraBr(linha.importado_em)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `${pagina * TAMANHO_PAGINA + 1}–${Math.min((pagina + 1) * TAMANHO_PAGINA, total)} de ${total}`
            : "0 resultados"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina === 0 || carregando}
            onClick={() => onPaginaChange(pagina - 1)}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina + 1 >= totalPaginas || carregando}
            onClick={() => onPaginaChange(pagina + 1)}
          >
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
