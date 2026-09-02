export const PRODUTOS_CEPEA = ["Boi Gordo", "Vaca Gorda", "Boi Magro", "Bezerro"] as const;

export type ProdutoCepea = (typeof PRODUTOS_CEPEA)[number];

export const REGIAO_ALVO = "GO-Goiânia";

export type CepeaCotacao = {
  id: string;
  data_cotacao: string;
  regiao: string;
  produto: string;
  valor_vista: number | null;
  variacao_dia_vista: number | null;
  minimo_vista: number | null;
  maximo_vista: number | null;
  valor_prazo_30d: number | null;
  variacao_dia_prazo: number | null;
  minimo_prazo_30d: number | null;
  maximo_prazo_30d: number | null;
  prazo_medio_pagamento: number | null;
  taxa_cdi_mensal: number | null;
  nome_arquivo: string | null;
  importado_em: string;
  created_at: string;
};

export type CepeaCotacaoInsert = Omit<CepeaCotacao, "id" | "importado_em" | "created_at">;

export type CepeaImportacaoStatus = "sucesso" | "erro" | "parcial";

export type CepeaImportacao = {
  id: string;
  nome_arquivo: string | null;
  data_cotacao: string | null;
  status: CepeaImportacaoStatus | string;
  quantidade_registros: number | null;
  mensagem: string | null;
  importado_em: string;
};

export type CepeaImportacaoInsert = Omit<CepeaImportacao, "id" | "importado_em">;
