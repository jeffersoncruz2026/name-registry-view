import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUTOS_CEPEA, type CepeaCotacao, type ProdutoCepea } from "@/lib/cepea/types";
import { formatarDataBr, formatarMoedaBr, formatarPercentualBr } from "@/lib/cepea/numberParser";

type PontoGrafico = Pick<
  CepeaCotacao,
  "data_cotacao" | "produto" | "valor_vista" | "variacao_dia_vista"
>;

function TooltipGrafico({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const ponto = payload[0]?.payload as PontoGrafico | undefined;
  if (!ponto) return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">
        {formatarDataBr(ponto.data_cotacao)} — {ponto.produto}
      </p>
      <p className="mt-1 text-muted-foreground">
        Valor à vista:{" "}
        <span className="tabular-nums text-foreground">{formatarMoedaBr(ponto.valor_vista)}</span>
      </p>
      <p className="text-muted-foreground">
        Variação diária:{" "}
        <span className="tabular-nums text-foreground">
          {formatarPercentualBr(ponto.variacao_dia_vista)}
        </span>
      </p>
    </div>
  );
}

export function CotacaoChart({
  dados,
  carregando,
  produto,
  onProdutoChange,
}: {
  dados: PontoGrafico[];
  carregando: boolean;
  produto: ProdutoCepea;
  onProdutoChange: (produto: ProdutoCepea) => void;
}) {
  const serie = useMemo(
    () =>
      dados
        .filter((p) => p.valor_vista != null)
        .sort((a, b) => a.data_cotacao.localeCompare(b.data_cotacao)),
    [dados],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Evolução do valor à vista</CardTitle>
        <Select value={produto} onValueChange={(valor) => onProdutoChange(valor as ProdutoCepea)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUTOS_CEPEA.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Carregando gráfico…
          </div>
        ) : serie.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Nenhuma cotação de {produto} para exibir no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="data_cotacao"
                tickFormatter={(valor: string) => formatarDataBr(valor)}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                minTickGap={24}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(valor: number) =>
                  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(valor)
                }
                width={56}
              />
              <Tooltip content={<TooltipGrafico />} />
              <Line
                type="monotone"
                dataKey="valor_vista"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
