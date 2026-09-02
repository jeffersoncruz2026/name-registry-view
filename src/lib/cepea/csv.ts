import type { CepeaCotacao } from "./types";
import { formatarDataBr, formatarNumeroBr } from "./numberParser";

const CABECALHO_CSV = [
  "Data da Cotação",
  "Região",
  "Produto",
  "Valor à Vista",
  "Variação Dia (Vista)",
  "Mínimo Vista",
  "Máximo Vista",
  "Valor a Prazo (30d)",
  "Variação Dia (Prazo)",
  "Mínimo Prazo (30d)",
  "Máximo Prazo (30d)",
  "Prazo Médio de Pagamento",
  "Taxa CDI Mensal",
  "Arquivo de Origem",
] as const;

function celulaCsv(valor: string): string {
  if (/[";\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function gerarCsvCotacoes(cotacoes: CepeaCotacao[]): string {
  const linhas = [CABECALHO_CSV.join(";")];

  for (const c of cotacoes) {
    const linha = [
      formatarDataBr(c.data_cotacao),
      c.regiao,
      c.produto,
      formatarNumeroBr(c.valor_vista),
      formatarNumeroBr(c.variacao_dia_vista),
      formatarNumeroBr(c.minimo_vista),
      formatarNumeroBr(c.maximo_vista),
      formatarNumeroBr(c.valor_prazo_30d),
      formatarNumeroBr(c.variacao_dia_prazo),
      formatarNumeroBr(c.minimo_prazo_30d),
      formatarNumeroBr(c.maximo_prazo_30d),
      formatarNumeroBr(c.prazo_medio_pagamento),
      formatarNumeroBr(c.taxa_cdi_mensal),
      c.nome_arquivo ?? "",
    ].map(celulaCsv);
    linhas.push(linha.join(";"));
  }

  return `\uFEFF${linhas.join("\r\n")}`;
}

export function baixarCsv(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
