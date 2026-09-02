import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import {
  PRODUTOS_CEPEA,
  REGIAO_ALVO,
  type CepeaCotacao,
  type ProdutoCepea,
} from "@/lib/cepea/types";

export type FiltrosCotacoes = {
  dataInicial: string | null;
  dataFinal: string | null;
  produto: ProdutoCepea | "todos";
};

export const TAMANHO_PAGINA = 15;

export function useUltimasCotacoes() {
  return useQuery({
    queryKey: ["cepea-ultimas-cotacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cepea_cotacoes")
        .select("*")
        .eq("regiao", REGIAO_ALVO)
        .order("data_cotacao", { ascending: false })
        .limit(400);
      if (error) throw error;

      const porProduto = new Map<string, CepeaCotacao>();
      for (const linha of data ?? []) {
        if (!porProduto.has(linha.produto)) porProduto.set(linha.produto, linha);
      }
      return PRODUTOS_CEPEA.map((produto) => porProduto.get(produto) ?? null);
    },
  });
}

export function useCotacoesHistorico(filtros: FiltrosCotacoes, pagina: number) {
  return useQuery({
    queryKey: ["cepea-historico", filtros, pagina],
    queryFn: async () => {
      let query = supabase
        .from("cepea_cotacoes")
        .select("*", { count: "exact" })
        .eq("regiao", REGIAO_ALVO)
        .order("data_cotacao", { ascending: false })
        .order("produto", { ascending: true });

      if (filtros.produto !== "todos") query = query.eq("produto", filtros.produto);
      if (filtros.dataInicial) query = query.gte("data_cotacao", filtros.dataInicial);
      if (filtros.dataFinal) query = query.lte("data_cotacao", filtros.dataFinal);

      const de = pagina * TAMANHO_PAGINA;
      const ate = de + TAMANHO_PAGINA - 1;
      const { data, error, count } = await query.range(de, ate);
      if (error) throw error;
      return { linhas: (data ?? []) as CepeaCotacao[], total: count ?? 0 };
    },
  });
}

export function useCotacoesGrafico(filtros: FiltrosCotacoes) {
  return useQuery({
    queryKey: ["cepea-grafico", filtros],
    queryFn: async () => {
      let query = supabase
        .from("cepea_cotacoes")
        .select("data_cotacao, produto, valor_vista")
        .eq("regiao", REGIAO_ALVO)
        .order("data_cotacao", { ascending: true })
        .limit(2000);

      if (filtros.produto !== "todos") query = query.eq("produto", filtros.produto);
      if (filtros.dataInicial) query = query.gte("data_cotacao", filtros.dataInicial);
      if (filtros.dataFinal) query = query.lte("data_cotacao", filtros.dataFinal);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Pick<CepeaCotacao, "data_cotacao" | "produto" | "valor_vista">[];
    },
  });
}

export async function buscarTodasCotacoesParaExportacao(
  filtros: FiltrosCotacoes,
): Promise<CepeaCotacao[]> {
  let query = supabase
    .from("cepea_cotacoes")
    .select("*")
    .eq("regiao", REGIAO_ALVO)
    .order("data_cotacao", { ascending: false })
    .order("produto", { ascending: true })
    .limit(10000);

  if (filtros.produto !== "todos") query = query.eq("produto", filtros.produto);
  if (filtros.dataInicial) query = query.gte("data_cotacao", filtros.dataInicial);
  if (filtros.dataFinal) query = query.lte("data_cotacao", filtros.dataFinal);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CepeaCotacao[];
}
