import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUTOS_CEPEA, type CepeaCotacao } from "@/lib/cepea/types";
import { formatarDataBr, formatarMoedaBr } from "@/lib/cepea/numberParser";

const CORES_PRODUTO: Record<string, string> = {
  "Boi Gordo": "var(--color-primary)",
  "Vaca Gorda": "var(--color-accent)",
  "Boi Magro": "oklch(0.62 0.15 60)",
  Bezerro: "oklch(0.55 0.18 20)",
};

type PontoGrafico = Pick<CepeaCotacao, "data_cotacao" | "produto" | "valor_vista">;

export function CotacaoChart({
  dados,
  carregando,
  produtoUnico,
}: {
  dados: PontoGrafico[];
  carregando: boolean;
  produtoUnico: string | null;
}) {
  const { serie, produtos } = useMemo(() => {
    const porData = new Map<string, Record<string, number | string>>();
    const produtosPresentes = new Set<string>();

    for (const ponto of dados) {
      if (ponto.valor_vista == null) continue;
      produtosPresentes.add(ponto.produto);
      const existente = porData.get(ponto.data_cotacao) ?? { data: ponto.data_cotacao };
      existente[ponto.produto] = ponto.valor_vista;
      porData.set(ponto.data_cotacao, existente);
    }

    const serieOrdenada = Array.from(porData.values()).sort((a, b) =>
      String(a["data"]).localeCompare(String(b["data"])),
    );

    const produtosOrdenados = PRODUTOS_CEPEA.filter((p) => produtosPresentes.has(p));

    return { serie: serieOrdenada, produtos: produtosOrdenados };
  }, [dados]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Evolução do valor à vista{produtoUnico ? ` — ${produtoUnico}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Carregando gráfico…
          </div>
        ) : serie.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Nenhuma cotação para exibir no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="data"
                tickFormatter={(valor: string) => formatarDataBr(valor)}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(valor: number) =>
                  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(valor)
                }
                width={56}
              />
              <Tooltip
                labelFormatter={(valor) => formatarDataBr(String(valor))}
                formatter={(valor: number, nome: string) => [formatarMoedaBr(valor), nome]}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {produtos.map((produto) => (
                <Line
                  key={produto}
                  type="monotone"
                  dataKey={produto}
                  stroke={CORES_PRODUTO[produto] ?? "var(--color-primary)"}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
