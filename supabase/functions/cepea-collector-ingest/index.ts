// Supabase Edge Function: cepea-collector-ingest
//
// Recebe cotações da região GO-Goiânia coletadas por um agente automatizado
// (programa instalado em um computador Windows autorizado) e grava na mesma
// tabela usada pela importação manual de PDF (upsert por
// data_cotacao + regiao + produto).
//
// Autenticação: cabeçalho "X-Collector-Key" comparado com o segredo
// CEPEA_COLLECTOR_KEY configurado nos Secrets do projeto Supabase. Esta
// função NÃO usa (nem exige) sessão de usuário do Lovable/Supabase Auth —
// o JWT verification deve estar desativado para ela em supabase/config.toml
// ([functions.cepea-collector-ingest] verify_jwt = false).
//
// O segredo nunca é devolvido, logado ou exibido em nenhuma resposta.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const REGIAO_ALVO = "GO-Goiânia";
const PRODUTOS_VALIDOS = ["Boi Gordo", "Vaca Gorda", "Boi Magro", "Bezerro"] as const;
type Produto = (typeof PRODUTOS_VALIDOS)[number];

const CAMPOS_NUMERICOS = [
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

function normalizarCompacto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const REGIAO_ALVO_NORMALIZADA = normalizarCompacto(REGIAO_ALVO);
const PRODUTOS_NORMALIZADOS = new Map(PRODUTOS_VALIDOS.map((p) => [normalizarCompacto(p), p]));

function respostaJson(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isDataIsoValida(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return false;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12) return false;
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return dia >= 1 && dia <= ultimoDiaDoMes;
}

function ehNumeroOuNulo(valor: unknown): valor is number | null {
  if (valor === null || valor === undefined) return true;
  return typeof valor === "number" && Number.isFinite(valor);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return respostaJson({ success: false, mensagem: "Método não suportado. Utilize POST." }, 400);
  }

  // --- Autenticação por chave própria (sem sessão de usuário) -------------
  const chaveEsperada = Deno.env.get("CEPEA_COLLECTOR_KEY");
  const chaveRecebida = req.headers.get("X-Collector-Key");

  if (!chaveEsperada) {
    console.error("CEPEA_COLLECTOR_KEY não configurado nos Secrets da função.");
    return respostaJson(
      { success: false, mensagem: "Automação não configurada no servidor." },
      500,
    );
  }

  if (!chaveRecebida || chaveRecebida !== chaveEsperada) {
    return respostaJson(
      { success: false, mensagem: "Chave de autenticação ausente ou inválida." },
      401,
    );
  }

  // --- Cliente administrativo (service_role, uso exclusivo no servidor) ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente da função.");
    return respostaJson({ success: false, mensagem: "Configuração interna ausente." }, 500);
  }
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  async function registrarTentativa(entrada: {
    nomeArquivo: string | null;
    dataCotacao: string | null;
    status: "sucesso" | "erro";
    quantidadeRegistros: number;
    mensagem: string;
  }) {
    const { error } = await supabaseAdmin.from("cepea_importacoes").insert({
      nome_arquivo: entrada.nomeArquivo,
      data_cotacao: entrada.dataCotacao,
      status: entrada.status,
      quantidade_registros: entrada.quantidadeRegistros,
      mensagem: entrada.mensagem,
    });
    if (error) console.error("Falha ao registrar tentativa em cepea_importacoes:", error.message);
  }

  async function falhar(
    mensagem: string,
    status: number,
    contexto: {
      nomeArquivo: string | null;
      dataCotacao: string | null;
    },
  ) {
    await registrarTentativa({
      nomeArquivo: contexto.nomeArquivo,
      dataCotacao: contexto.dataCotacao,
      status: "erro",
      quantidadeRegistros: 0,
      mensagem,
    });
    return respostaJson({ success: false, mensagem }, status);
  }

  // --- Corpo da requisição --------------------------------------------------
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return falhar("Corpo da requisição deve ser um JSON válido.", 400, {
      nomeArquivo: null,
      dataCotacao: null,
    });
  }

  if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
    return falhar("Corpo da requisição inválido.", 400, { nomeArquivo: null, dataCotacao: null });
  }

  const payload = corpo as Record<string, unknown>;
  const nomeArquivo = typeof payload.nome_arquivo === "string" ? payload.nome_arquivo : null;

  if (payload.nome_arquivo !== undefined && payload.nome_arquivo !== null && nomeArquivo === null) {
    return falhar('Campo "nome_arquivo" deve ser texto.', 400, {
      nomeArquivo: null,
      dataCotacao: null,
    });
  }

  const dataCotacao = payload.data_cotacao;
  if (!isDataIsoValida(dataCotacao)) {
    return falhar('Campo "data_cotacao" ausente ou inválido. Use o formato AAAA-MM-DD.', 400, {
      nomeArquivo,
      dataCotacao: null,
    });
  }

  const hojeIso = new Date().toISOString().slice(0, 10);
  if (dataCotacao > hojeIso) {
    return falhar("Não é permitido importar cotações com data futura.", 400, {
      nomeArquivo,
      dataCotacao,
    });
  }

  const taxaCdiMensal = payload.taxa_cdi_mensal;
  if (!ehNumeroOuNulo(taxaCdiMensal)) {
    return falhar('Campo "taxa_cdi_mensal" deve ser numérico ou nulo.', 400, {
      nomeArquivo,
      dataCotacao,
    });
  }

  const cotacoes = payload.cotacoes;
  if (!Array.isArray(cotacoes) || cotacoes.length !== 4) {
    return falhar('Campo "cotacoes" deve conter exatamente 4 produtos.', 400, {
      nomeArquivo,
      dataCotacao,
    });
  }

  // --- Validação de cada produto (tudo ou nada: nenhuma gravação parcial) --
  const linhas: Record<string, unknown>[] = [];
  const produtosVistos = new Set<Produto>();

  for (let indice = 0; indice < cotacoes.length; indice++) {
    const item = cotacoes[indice];
    if (typeof item !== "object" || item === null) {
      return falhar(`Item ${indice + 1} de "cotacoes" é inválido.`, 400, {
        nomeArquivo,
        dataCotacao,
      });
    }
    const cot = item as Record<string, unknown>;

    if (
      typeof cot.regiao !== "string" ||
      normalizarCompacto(cot.regiao) !== REGIAO_ALVO_NORMALIZADA
    ) {
      return falhar(
        `Item ${indice + 1}: região inválida. Somente "${REGIAO_ALVO}" é aceita.`,
        400,
        {
          nomeArquivo,
          dataCotacao,
        },
      );
    }

    if (typeof cot.produto !== "string") {
      return falhar(`Item ${indice + 1}: produto ausente ou inválido.`, 400, {
        nomeArquivo,
        dataCotacao,
      });
    }
    const produtoCanonico = PRODUTOS_NORMALIZADOS.get(normalizarCompacto(cot.produto));
    if (!produtoCanonico) {
      return falhar(
        `Item ${indice + 1}: produto "${cot.produto}" inválido. Aceitos: ${PRODUTOS_VALIDOS.join(", ")}.`,
        400,
        { nomeArquivo, dataCotacao },
      );
    }
    if (produtosVistos.has(produtoCanonico)) {
      return falhar(`Produto "${produtoCanonico}" duplicado em "cotacoes".`, 400, {
        nomeArquivo,
        dataCotacao,
      });
    }
    produtosVistos.add(produtoCanonico);

    const camposConvertidos: Record<string, number | null> = {};
    for (const campo of CAMPOS_NUMERICOS) {
      const valor = cot[campo];
      if (!ehNumeroOuNulo(valor)) {
        return falhar(
          `Item ${indice + 1} (${produtoCanonico}): campo "${campo}" deve ser numérico ou nulo.`,
          400,
          { nomeArquivo, dataCotacao },
        );
      }
      camposConvertidos[campo] = valor === undefined ? null : valor;
    }

    linhas.push({
      data_cotacao: dataCotacao,
      regiao: REGIAO_ALVO,
      produto: produtoCanonico,
      ...camposConvertidos,
      taxa_cdi_mensal: taxaCdiMensal ?? null,
      nome_arquivo: nomeArquivo,
    });
  }

  if (produtosVistos.size !== 4) {
    return falhar(
      "É necessário informar os 4 produtos distintos: Boi Gordo, Vaca Gorda, Boi Magro e Bezerro.",
      400,
      { nomeArquivo, dataCotacao },
    );
  }

  // --- Gravação atômica (upsert de lote único = uma única transação) ------
  const { error: erroUpsert } = await supabaseAdmin
    .from("cepea_cotacoes")
    .upsert(linhas, { onConflict: "data_cotacao,regiao,produto" });

  if (erroUpsert) {
    const status = erroUpsert.code === "23505" ? 409 : 500;
    return falhar(`Falha ao gravar cotações: ${erroUpsert.message}`, status, {
      nomeArquivo,
      dataCotacao,
    });
  }

  const mensagemSucesso = `Cotações de ${REGIAO_ALVO} importadas com sucesso.`;
  await registrarTentativa({
    nomeArquivo,
    dataCotacao,
    status: "sucesso",
    quantidadeRegistros: linhas.length,
    mensagem: mensagemSucesso,
  });

  return respostaJson(
    {
      success: true,
      data_cotacao: dataCotacao,
      registros_processados: linhas.length,
      mensagem: mensagemSucesso,
    },
    200,
  );
});
