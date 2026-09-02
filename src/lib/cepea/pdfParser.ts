import { PRODUTOS_CEPEA, REGIAO_ALVO, type ProdutoCepea } from "./types";
import { parseNumeroBr, parseTaxaCdiMensal } from "./numberParser";

export type CepeaProdutoExtraido = {
  produto: ProdutoCepea;
  valor_vista: number | null;
  variacao_dia_vista: number | null;
  minimo_vista: number | null;
  maximo_vista: number | null;
  valor_prazo_30d: number | null;
  variacao_dia_prazo: number | null;
  minimo_prazo_30d: number | null;
  maximo_prazo_30d: number | null;
  prazo_medio_pagamento: number | null;
  linhaOriginal: string;
};

export type ResultadoExtracaoCepea = {
  sucesso: boolean;
  nomeArquivo: string;
  dataCotacao: string | null;
  taxaCdiMensal: number | null;
  regiaoTextoOriginal: string | null;
  produtos: CepeaProdutoExtraido[];
  avisos: string[];
  erro: string | null;
};

type LinhaExtraida = {
  texto: string;
  y: number;
  pagina: number;
};

/** Remove acentos, espaços e pontuação; deixa só letras/dígitos maiúsculos, para comparação tolerante. */
function normalizarCompacto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const REGIAO_ALVO_NORMALIZADA = normalizarCompacto(REGIAO_ALVO); // "GOGOIANIA"

async function carregarPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

async function extrairLinhasDoPdf(arquivo: File): Promise<LinhaExtraida[]> {
  const pdfjsLib = await carregarPdfjs();
  const bytes = await arquivo.arrayBuffer();
  const documento = await pdfjsLib.getDocument({ data: bytes }).promise;

  const linhas: LinhaExtraida[] = [];

  for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina++) {
    const pagina = await documento.getPage(numeroPagina);
    const conteudo = await pagina.getTextContent();

    type Item = { x: number; y: number; str: string };
    const itens: Item[] = [];
    for (const item of conteudo.items) {
      if (!("str" in item)) continue;
      const texto = item.str;
      if (texto == null || texto.trim().length === 0) continue;
      const transform = item.transform as number[];
      itens.push({ x: transform[4] ?? 0, y: transform[5] ?? 0, str: texto });
    }

    // Agrupa itens na mesma linha (tolerância de posição vertical).
    const grupos: Item[][] = [];
    const TOLERANCIA_Y = 2.5;
    for (const item of itens.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const grupo = grupos.find((g) => Math.abs((g[0]?.y ?? 0) - item.y) <= TOLERANCIA_Y);
      if (grupo) {
        grupo.push(item);
      } else {
        grupos.push([item]);
      }
    }

    for (const grupo of grupos) {
      const ordenado = grupo.sort((a, b) => a.x - b.x);
      const texto = ordenado
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (texto.length > 0) {
        linhas.push({ texto, y: ordenado[0]?.y ?? 0, pagina: numeroPagina });
      }
    }
  }

  return linhas;
}

/** Extrai a data DD/MM/AAAA do título "Preços Regionais da Pecuária de Corte ... DD/MM/AAAA". */
function extrairDataCotacao(textoCompleto: string, avisos: string[]): string | null {
  const regexTitulo =
    /Pre[çc]os\s+Regionais\s+da\s+Pecu[áa]ria\s+de\s+Corte[\s\S]{0,120}?(\d{2}\/\d{2}\/\d{4})/i;
  const matchTitulo = textoCompleto.match(regexTitulo);

  let dataEncontrada: string | null = null;
  if (matchTitulo?.[1]) {
    dataEncontrada = matchTitulo[1];
  } else {
    avisos.push(
      'Não foi possível localizar o título "Preços Regionais da Pecuária de Corte" com data; ' +
        "usando a primeira data encontrada no documento como alternativa.",
    );
    const matchGenerico = textoCompleto.match(/\d{2}\/\d{2}\/\d{4}/);
    dataEncontrada = matchGenerico?.[0] ?? null;
  }

  if (!dataEncontrada) return null;

  const partes = dataEncontrada.split("/");
  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];
  if (!dia || !mes || !ano) return null;
  return `${ano}-${mes}-${dia}`;
}

const REGEX_TAXA_CDI =
  /Taxa\s+Referencial\s+CDI\s*\(\s*Mensal\s*\)[^\d-]{0,20}(-?\d+(?:[.,]\d+)?\s*%?|nd\s*%?)/i;

/**
 * Extrai a "Taxa Referencial CDI(Mensal)" correspondente à página onde a
 * região alvo foi encontrada (cada página do compacto pode trazer uma taxa
 * diferente). Cai para uma busca no documento inteiro apenas se a página da
 * região não tiver essa informação.
 */
function extrairTaxaCdiMensal(
  linhas: LinhaExtraida[],
  paginaRegiao: number | null,
  avisos: string[],
): number | null {
  if (paginaRegiao != null) {
    const textoPagina = linhas
      .filter((l) => l.pagina === paginaRegiao)
      .map((l) => l.texto)
      .join("\n");
    const matchPagina = textoPagina.match(REGEX_TAXA_CDI);
    if (matchPagina?.[1]) return parseTaxaCdiMensal(matchPagina[1]);
  }

  avisos.push(
    `Não foi possível localizar a "Taxa Referencial CDI(Mensal)" na página da região ${REGIAO_ALVO}; ` +
      "usando a primeira ocorrência encontrada no documento.",
  );
  const textoCompleto = linhas.map((l) => l.texto).join("\n");
  const matchGlobal = textoCompleto.match(REGEX_TAXA_CDI);
  return matchGlobal?.[1] ? parseTaxaCdiMensal(matchGlobal[1]) : null;
}

/** Se as primeiras palavras da linha correspondem à região alvo, retorna os tokens restantes. */
function removerPrefixoRegiao(tokens: string[]): { encontrado: boolean; restante: string[] } {
  for (let quantidadeTokens = 1; quantidadeTokens <= 3; quantidadeTokens++) {
    const candidato = tokens.slice(0, quantidadeTokens).join("");
    if (normalizarCompacto(candidato) === REGIAO_ALVO_NORMALIZADA) {
      return { encontrado: true, restante: tokens.slice(quantidadeTokens) };
    }
  }
  return { encontrado: false, restante: tokens };
}

/** Detecta se a linha inicia com um rótulo de região diferente da região alvo (ex: "GO-Rio Verde"). */
function pareceOutraRegiao(tokens: string[]): boolean {
  const primeiro = tokens[0] ?? "";
  return (
    /^[A-ZÀ-Ú]{2}-[A-ZÀ-Úa-zà-ú]/.test(primeiro) &&
    normalizarCompacto(primeiro) !== REGIAO_ALVO_NORMALIZADA
  );
}

/** Verifica se os tokens iniciais correspondem a um dos produtos esperados. */
function combinarProduto(tokens: string[]): { produto: ProdutoCepea; restante: string[] } | null {
  for (const produto of PRODUTOS_CEPEA) {
    const palavrasProduto = produto.split(" ");
    if (tokens.length < palavrasProduto.length) continue;
    const candidato = tokens.slice(0, palavrasProduto.length).join(" ");
    if (normalizarCompacto(candidato) === normalizarCompacto(produto)) {
      return { produto, restante: tokens.slice(palavrasProduto.length) };
    }
  }
  return null;
}

/** Junta um token "-" isolado ao número seguinte (espaçamento incomum de PDF) e extrai valores numéricos/"nd". */
function extrairTokensNumericos(tokens: string[]): string[] {
  const mesclados: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const atual = tokens[i];
    if (atual === undefined) continue;
    if (atual === "-" && tokens[i + 1] && /^\d/.test(tokens[i + 1] as string)) {
      mesclados.push(`-${tokens[i + 1]}`);
      i++;
    } else {
      mesclados.push(atual);
    }
  }
  return mesclados.filter((t) => /^-?\d[\d.,]*%?$/.test(t) || /^nd%?$/i.test(t));
}

const CAMPOS_NUMERICOS_ORDEM = [
  "valor_vista",
  "variacao_dia_vista",
  "minimo_vista",
  "maximo_vista",
  "valor_prazo_30d",
  "variacao_dia_prazo",
  "minimo_prazo_30d",
  "maximo_prazo_30d",
  "prazo_medio_pagamento",
] as const;

function montarProdutoExtraido(
  produto: ProdutoCepea,
  tokensNumericos: string[],
  linhaOriginal: string,
  avisos: string[],
): CepeaProdutoExtraido {
  if (tokensNumericos.length !== CAMPOS_NUMERICOS_ORDEM.length) {
    avisos.push(
      `Linha do produto "${produto}" com número inesperado de colunas ` +
        `(${tokensNumericos.length} encontradas, 9 esperadas): "${linhaOriginal}"`,
    );
  }

  const resultado: Partial<Record<(typeof CAMPOS_NUMERICOS_ORDEM)[number], number | null>> = {};
  CAMPOS_NUMERICOS_ORDEM.forEach((campo, indice) => {
    const token = tokensNumericos[indice];
    resultado[campo] = token !== undefined ? parseNumeroBr(token) : null;
  });

  return {
    produto,
    valor_vista: resultado.valor_vista ?? null,
    variacao_dia_vista: resultado.variacao_dia_vista ?? null,
    minimo_vista: resultado.minimo_vista ?? null,
    maximo_vista: resultado.maximo_vista ?? null,
    valor_prazo_30d: resultado.valor_prazo_30d ?? null,
    variacao_dia_prazo: resultado.variacao_dia_prazo ?? null,
    minimo_prazo_30d: resultado.minimo_prazo_30d ?? null,
    maximo_prazo_30d: resultado.maximo_prazo_30d ?? null,
    prazo_medio_pagamento: resultado.prazo_medio_pagamento ?? null,
    linhaOriginal,
  };
}

function extrairProdutosRegiaoAlvo(
  linhas: LinhaExtraida[],
  avisos: string[],
): { produtos: CepeaProdutoExtraido[]; regiaoTextoOriginal: string | null; pagina: number | null } {
  const produtos: CepeaProdutoExtraido[] = [];
  let regiaoTextoOriginal: string | null = null;
  let indiceInicio = -1;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha) continue;
    const tokens = linha.texto.split(" ").filter(Boolean);
    const { encontrado, restante } = removerPrefixoRegiao(tokens);
    if (encontrado) {
      indiceInicio = i;
      regiaoTextoOriginal = tokens.slice(0, tokens.length - restante.length).join(" ");
      const combinado = combinarProduto(restante);
      if (combinado) {
        const numeros = extrairTokensNumericos(combinado.restante);
        produtos.push(montarProdutoExtraido(combinado.produto, numeros, linha.texto, avisos));
      }
      break;
    }
  }

  if (indiceInicio === -1) {
    return { produtos: [], regiaoTextoOriginal: null, pagina: null };
  }

  const paginaRegiao = linhas[indiceInicio]?.pagina ?? null;

  const LIMITE_LINHAS_VARREDURA = 30;
  for (
    let i = indiceInicio + 1;
    i < linhas.length &&
    produtos.length < PRODUTOS_CEPEA.length &&
    i <= indiceInicio + LIMITE_LINHAS_VARREDURA;
    i++
  ) {
    const linha = linhas[i];
    if (!linha) continue;
    let tokens = linha.texto.split(" ").filter(Boolean);

    if (pareceOutraRegiao(tokens)) break;

    const { restante: semRegiao } = removerPrefixoRegiao(tokens);
    tokens = semRegiao;

    const combinado = combinarProduto(tokens);
    if (!combinado) continue;

    if (produtos.some((p) => p.produto === combinado.produto)) continue;

    const numeros = extrairTokensNumericos(combinado.restante);
    produtos.push(montarProdutoExtraido(combinado.produto, numeros, linha.texto, avisos));
  }

  return { produtos, regiaoTextoOriginal, pagina: paginaRegiao };
}

export async function extrairCepeaPdf(arquivo: File): Promise<ResultadoExtracaoCepea> {
  const avisos: string[] = [];

  try {
    const linhas = await extrairLinhasDoPdf(arquivo);
    const textoCompleto = linhas.map((l) => l.texto).join("\n");

    if (textoCompleto.trim().length === 0) {
      return {
        sucesso: false,
        nomeArquivo: arquivo.name,
        dataCotacao: null,
        taxaCdiMensal: null,
        regiaoTextoOriginal: null,
        produtos: [],
        avisos,
        erro: "Não foi possível extrair texto do PDF (arquivo pode ser uma imagem digitalizada).",
      };
    }

    const dataCotacao = extrairDataCotacao(textoCompleto, avisos);
    const { produtos, regiaoTextoOriginal, pagina } = extrairProdutosRegiaoAlvo(linhas, avisos);
    const taxaCdiMensal = extrairTaxaCdiMensal(linhas, pagina, avisos);

    if (produtos.length === 0) {
      return {
        sucesso: false,
        nomeArquivo: arquivo.name,
        dataCotacao,
        taxaCdiMensal,
        regiaoTextoOriginal: null,
        produtos: [],
        avisos,
        erro: `Região "${REGIAO_ALVO}" não encontrada no PDF. Verifique se este é o Compacto de Preços da Pecuária de Corte e se a região está presente no relatório.`,
      };
    }

    if (produtos.length < PRODUTOS_CEPEA.length) {
      const faltantes = PRODUTOS_CEPEA.filter((p) => !produtos.some((e) => e.produto === p));
      avisos.push(`Produtos não encontrados para ${REGIAO_ALVO}: ${faltantes.join(", ")}.`);
    }

    if (!dataCotacao) {
      return {
        sucesso: false,
        nomeArquivo: arquivo.name,
        dataCotacao: null,
        taxaCdiMensal,
        regiaoTextoOriginal,
        produtos,
        avisos,
        erro: "Não foi possível identificar a data da cotação no PDF.",
      };
    }

    return {
      sucesso: true,
      nomeArquivo: arquivo.name,
      dataCotacao,
      taxaCdiMensal,
      regiaoTextoOriginal,
      produtos,
      avisos,
      erro: null,
    };
  } catch (erro) {
    return {
      sucesso: false,
      nomeArquivo: arquivo.name,
      dataCotacao: null,
      taxaCdiMensal: null,
      regiaoTextoOriginal: null,
      produtos: [],
      avisos,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido ao ler o PDF.",
    };
  }
}
