import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CotacaoCard } from "@/components/cepea/CotacaoCard";
import { CotacaoChart } from "@/components/cepea/CotacaoChart";
import { CotacoesTable } from "@/components/cepea/CotacoesTable";
import { FiltrosPainel } from "@/components/cepea/FiltrosPainel";
import { ImportPdfDialog } from "@/components/cepea/ImportPdfDialog";
import { PRODUTOS_CEPEA, type ProdutoCepea } from "@/lib/cepea/types";
import { baixarCsv, gerarCsvCotacoes } from "@/lib/cepea/csv";
import {
  buscarTodasCotacoesParaExportacao,
  useCotacoesGrafico,
  useCotacoesHistorico,
  useUltimasCotacoes,
  type FiltrosCotacoes,
} from "@/hooks/useCepeaCotacoes";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Cotações CEPEA Goiânia" },
      {
        name: "description",
        content: "Histórico e evolução das cotações CEPEA da região GO-Goiânia.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <PainelPrincipal />
      </AppShell>
    </RequireAuth>
  ),
});

function PainelPrincipal() {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<FiltrosCotacoes>({
    dataInicial: null,
    dataFinal: null,
    produto: "todos",
  });
  const [pagina, setPagina] = useState(0);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [produtoGrafico, setProdutoGrafico] = useState<ProdutoCepea>("Boi Gordo");

  const ultimasCotacoes = useUltimasCotacoes();
  const historico = useCotacoesHistorico(filtros, pagina);
  const grafico = useCotacoesGrafico({
    dataInicial: filtros.dataInicial,
    dataFinal: filtros.dataFinal,
    produto: produtoGrafico,
  });

  function atualizarFiltros(novosFiltros: FiltrosCotacoes) {
    setFiltros(novosFiltros);
    setPagina(0);
  }

  function aoImportar() {
    queryClient.invalidateQueries({ queryKey: ["cepea-ultimas-cotacoes"] });
    queryClient.invalidateQueries({ queryKey: ["cepea-historico"] });
    queryClient.invalidateQueries({ queryKey: ["cepea-grafico"] });
    queryClient.invalidateQueries({ queryKey: ["cepea-importacoes"] });
  }

  async function exportarCsv() {
    setExportando(true);
    try {
      const linhas = await buscarTodasCotacoesParaExportacao(filtros);
      const csv = gerarCsvCotacoes(linhas);
      const dataAtual = new Date().toISOString().slice(0, 10);
      baixarCsv(csv, `cepea-goiania-${dataAtual}.csv`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Painel de Cotações — GO-Goiânia
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico de preços da pecuária de corte extraído do Compacto de Preços CEPEA.
        </p>
      </div>

      <FiltrosPainel
        filtros={filtros}
        onFiltrosChange={atualizarFiltros}
        onImportar={() => setDialogAberto(true)}
        onExportar={() => void exportarCsv()}
        exportando={exportando}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUTOS_CEPEA.map((produto, indice) => (
          <CotacaoCard
            key={produto}
            produto={produto}
            cotacao={ultimasCotacoes.data?.[indice] ?? null}
          />
        ))}
      </div>

      <CotacaoChart
        dados={grafico.data ?? []}
        carregando={grafico.isLoading}
        produto={produtoGrafico}
        onProdutoChange={setProdutoGrafico}
      />

      <CotacoesTable
        linhas={historico.data?.linhas ?? []}
        total={historico.data?.total ?? 0}
        pagina={pagina}
        onPaginaChange={setPagina}
        carregando={historico.isLoading}
        erro={historico.isError ? (historico.error as Error).message : null}
      />

      <ImportPdfDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        onImportado={aoImportar}
      />
    </div>
  );
}
