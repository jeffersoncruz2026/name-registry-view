import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import { REGIAO_ALVO } from "@/lib/cepea/types";
import type { CepeaImportacao } from "@/lib/cepea/types";

/** Último dia útil (segunda a sexta) até a data de referência, em ISO (AAAA-MM-DD). */
function ultimoDiaUtilIso(referencia: Date): string {
  const data = new Date(
    Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate()),
  );
  const diaSemana = data.getUTCDay(); // 0 = domingo, 6 = sábado
  if (diaSemana === 0) data.setUTCDate(data.getUTCDate() - 2);
  else if (diaSemana === 6) data.setUTCDate(data.getUTCDate() - 1);
  return data.toISOString().slice(0, 10);
}

export type StatusAutomacaoCepea = {
  diaUtilEsperado: string;
  ultimaDataCotacao: string | null;
  atualizado: boolean;
  ultimoSucesso: CepeaImportacao | null;
  ultimoErro: CepeaImportacao | null;
  historico: CepeaImportacao[];
};

const LIMITE_HISTORICO_CONSULTADO = 200;
const LIMITE_HISTORICO_EXIBIDO = 10;

export function useAutomacaoCepea() {
  return useQuery({
    queryKey: ["cepea-automacao-status"],
    queryFn: async (): Promise<StatusAutomacaoCepea> => {
      const [ultimaCotacaoResp, importacoesResp] = await Promise.all([
        supabase
          .from("cepea_cotacoes")
          .select("data_cotacao")
          .eq("regiao", REGIAO_ALVO)
          .order("data_cotacao", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("cepea_importacoes")
          .select("*")
          .order("importado_em", { ascending: false })
          .limit(LIMITE_HISTORICO_CONSULTADO),
      ]);

      if (ultimaCotacaoResp.error) throw ultimaCotacaoResp.error;
      if (importacoesResp.error) throw importacoesResp.error;

      const importacoes = (importacoesResp.data ?? []) as CepeaImportacao[];
      const diaUtilEsperado = ultimoDiaUtilIso(new Date());
      const ultimaDataCotacao = ultimaCotacaoResp.data?.data_cotacao ?? null;

      return {
        diaUtilEsperado,
        ultimaDataCotacao,
        atualizado: ultimaDataCotacao != null && ultimaDataCotacao >= diaUtilEsperado,
        ultimoSucesso: importacoes.find((i) => i.status === "sucesso") ?? null,
        ultimoErro: importacoes.find((i) => i.status === "erro") ?? null,
        historico: importacoes.slice(0, LIMITE_HISTORICO_EXIBIDO),
      };
    },
  });
}
