import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatarDataBr, formatarMoedaBr, formatarPercentualBr } from "@/lib/cepea/numberParser";
import type { CepeaCotacao, ProdutoCepea } from "@/lib/cepea/types";

export function CotacaoCard({
  produto,
  cotacao,
}: {
  produto: ProdutoCepea;
  cotacao: CepeaCotacao | null;
}) {
  const variacao = cotacao?.variacao_dia_vista ?? null;
  const tendencia = variacao == null || variacao === 0 ? "neutro" : variacao > 0 ? "alta" : "baixa";

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-muted-foreground">{produto}</p>
      </CardHeader>
      <CardContent>
        {cotacao ? (
          <>
            <p className="tabular-nums text-2xl font-semibold text-foreground">
              {formatarMoedaBr(cotacao.valor_vista)}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                  tendencia === "alta" && "bg-positivo/10 text-positivo",
                  tendencia === "baixa" && "bg-negativo/10 text-negativo",
                  tendencia === "neutro" && "bg-muted text-muted-foreground",
                )}
              >
                {tendencia === "alta" && <ArrowUp className="size-3" />}
                {tendencia === "baixa" && <ArrowDown className="size-3" />}
                {tendencia === "neutro" && <Minus className="size-3" />}
                {formatarPercentualBr(variacao)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatarDataBr(cotacao.data_cotacao)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sem cotações importadas ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
