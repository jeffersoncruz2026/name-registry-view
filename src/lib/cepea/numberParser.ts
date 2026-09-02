/**
 * Conversão de números no formato brasileiro (usado nos relatórios CEPEA) para `number`.
 *
 * Exemplos:
 *   "317,23"    -> 317.23
 *   "4.392,50"  -> 4392.50
 *   "-0,04%"    -> -0.04
 *   "nd" / "nd%"-> null
 */

const VAZIO_TOKENS = new Set(["nd", "nd%", "n/d", "n.d.", "-", "--", ""]);

export function parseNumeroBr(raw: string | null | undefined): number | null {
  if (raw == null) return null;

  const semEspacos = raw.trim();
  if (semEspacos.length === 0) return null;

  const normalizado = semEspacos.toLowerCase();
  if (VAZIO_TOKENS.has(normalizado)) return null;

  // Remove percentual e espaços internos, mantém sinal e dígitos/separadores.
  const limpo = semEspacos.replace(/%/g, "").replace(/\s+/g, "");
  if (limpo.length === 0 || VAZIO_TOKENS.has(limpo.toLowerCase())) return null;

  // Só dígitos, ponto (milhar), vírgula (decimal) e sinal de menos são aceitos.
  if (!/^-?[\d.,]+$/.test(limpo)) return null;

  // Formato brasileiro: "." separa milhares, "," separa decimais.
  const semMilhar = limpo.replace(/\./g, "");
  const comPontoDecimal = semMilhar.replace(",", ".");

  const valor = Number(comPontoDecimal);
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Conversão específica da Taxa Referencial CDI (Mensal): aceita "." ou ","
 * como separador decimal — nunca como separador de milhar, pois a taxa é
 * sempre um valor pequeno (ex.: "1.2152%" ou "1,2152%" -> 1.2152).
 */
export function parseTaxaCdiMensal(raw: string | null | undefined): number | null {
  if (raw == null) return null;

  const semEspacos = raw.trim();
  if (semEspacos.length === 0) return null;

  const normalizado = semEspacos.toLowerCase();
  if (VAZIO_TOKENS.has(normalizado)) return null;

  const limpo = semEspacos.replace(/%/g, "").replace(/\s+/g, "");
  if (limpo.length === 0 || VAZIO_TOKENS.has(limpo.toLowerCase())) return null;

  if (!/^-?\d+([.,]\d+)?$/.test(limpo)) return null;

  const comPontoDecimal = limpo.replace(",", ".");
  const valor = Number(comPontoDecimal);
  return Number.isFinite(valor) ? valor : null;
}

export function formatarNumeroBr(
  valor: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(valor);
}

export function formatarMoedaBr(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarPercentualBr(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  const formatado = formatarNumeroBr(valor);
  return `${valor > 0 ? "+" : ""}${formatado}%`;
}

/**
 * Formatação da Taxa Referencial CDI (Mensal) para exibição: valor armazenado
 * 1.2152 -> "1,2152%". Sem sinal de "+" e sempre com quatro casas decimais.
 * Não usa Intl.NumberFormat com style: "percent", pois esse modo multiplica
 * o valor por 100 (1.2152 viraria "121,52%").
 */
export function formatarTaxaCdiBr(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  const formatado = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(valor);
  return `${formatado}%`;
}

export function formatarDataBr(data: string | Date | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(`${data}T00:00:00`) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatarDataHoraBr(data: string | Date | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
