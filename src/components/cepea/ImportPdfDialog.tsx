import { useRef, useState, type DragEvent } from "react";
import { AlertTriangle, CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { extrairCepeaPdf, type ResultadoExtracaoCepea } from "@/lib/cepea/pdfParser";
import { formatarDataBr, formatarNumeroBr, formatarPercentualBr } from "@/lib/cepea/numberParser";
import { REGIAO_ALVO, type CepeaCotacaoInsert } from "@/lib/cepea/types";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Etapa = "selecao" | "processando" | "revisao" | "salvando" | "concluido";

export function ImportPdfDialog({
  aberto,
  onOpenChange,
  onImportado,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onImportado: () => void;
}) {
  const [etapa, setEtapa] = useState<Etapa>("selecao");
  const [arrastando, setArrastando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExtracaoCepea | null>(null);
  const [mensagemFinal, setMensagemFinal] = useState<{ ok: boolean; texto: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetar() {
    setEtapa("selecao");
    setResultado(null);
    setMensagemFinal(null);
    setArrastando(false);
  }

  function fechar(novoEstado: boolean) {
    if (!novoEstado) resetar();
    onOpenChange(novoEstado);
  }

  async function processarArquivo(arquivo: File) {
    if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
      setMensagemFinal({ ok: false, texto: "Selecione um arquivo PDF válido." });
      setEtapa("concluido");
      return;
    }

    setEtapa("processando");
    const extraido = await extrairCepeaPdf(arquivo);
    setResultado(extraido);

    if (!extraido.sucesso) {
      await registrarImportacao({
        nome_arquivo: extraido.nomeArquivo,
        data_cotacao: extraido.dataCotacao,
        status: "erro",
        quantidade_registros: 0,
        mensagem: extraido.erro ?? "Falha desconhecida ao extrair o PDF.",
      });
      onImportado();
      setEtapa("concluido");
      setMensagemFinal({ ok: false, texto: extraido.erro ?? "Falha ao processar o PDF." });
      return;
    }

    setEtapa("revisao");
  }

  async function registrarImportacao(entrada: {
    nome_arquivo: string | null;
    data_cotacao: string | null;
    status: string;
    quantidade_registros: number;
    mensagem: string;
  }) {
    const { error } = await supabase.from("cepea_importacoes").insert(entrada);
    if (error) console.error("Falha ao registrar importação:", error.message);
  }

  async function confirmarImportacao() {
    if (!resultado || !resultado.dataCotacao) return;
    setEtapa("salvando");

    const linhas: CepeaCotacaoInsert[] = resultado.produtos.map((p) => ({
      data_cotacao: resultado.dataCotacao as string,
      regiao: REGIAO_ALVO,
      produto: p.produto,
      valor_vista: p.valor_vista,
      variacao_dia_vista: p.variacao_dia_vista,
      minimo_vista: p.minimo_vista,
      maximo_vista: p.maximo_vista,
      valor_prazo_30d: p.valor_prazo_30d,
      variacao_dia_prazo: p.variacao_dia_prazo,
      minimo_prazo_30d: p.minimo_prazo_30d,
      maximo_prazo_30d: p.maximo_prazo_30d,
      prazo_medio_pagamento: p.prazo_medio_pagamento,
      taxa_cdi_mensal: resultado.taxaCdiMensal,
      nome_arquivo: resultado.nomeArquivo,
    }));

    const { error } = await supabase
      .from("cepea_cotacoes")
      .upsert(linhas, { onConflict: "data_cotacao,regiao,produto" });

    const sucesso = !error;
    const status = error ? "erro" : resultado.avisos.length > 0 ? "parcial" : "sucesso";
    const mensagem = error
      ? `Falha ao salvar: ${error.message}`
      : resultado.avisos.length > 0
        ? resultado.avisos.join(" ")
        : `${linhas.length} produto(s) importado(s) com sucesso para ${REGIAO_ALVO}.`;

    await registrarImportacao({
      nome_arquivo: resultado.nomeArquivo,
      data_cotacao: resultado.dataCotacao,
      status,
      quantidade_registros: sucesso ? linhas.length : 0,
      mensagem,
    });

    onImportado();
    setMensagemFinal({ ok: sucesso, texto: mensagem });
    setEtapa("concluido");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando(false);
    const arquivo = event.dataTransfer.files?.[0];
    if (arquivo) void processarArquivo(arquivo);
  }

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar PDF do Compacto de Preços CEPEA</DialogTitle>
          <DialogDescription>
            Apenas dados da região {REGIAO_ALVO} serão extraídos e importados.
          </DialogDescription>
        </DialogHeader>

        {etapa === "selecao" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
              arrastando ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm text-foreground">
              Arraste o PDF aqui ou{" "}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-2"
                onClick={() => inputRef.current?.click()}
              >
                selecione um arquivo
              </button>
            </p>
            <p className="text-xs text-muted-foreground">Somente arquivos .pdf</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) void processarArquivo(arquivo);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {etapa === "processando" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Lendo e extraindo dados do PDF…</p>
          </div>
        )}

        {etapa === "revisao" && resultado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Arquivo</p>
                <p className="flex items-center gap-1.5 truncate font-medium">
                  <FileText className="size-3.5 shrink-0" /> {resultado.nomeArquivo}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data da cotação</p>
                <p className="font-medium">{formatarDataBr(resultado.dataCotacao)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Região identificada</p>
                <p className="font-medium">{resultado.regiaoTextoOriginal ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa CDI (Mensal)</p>
                <p className="font-medium">{formatarPercentualBr(resultado.taxaCdiMensal)}</p>
              </div>
            </div>

            {resultado.avisos.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <ul className="list-inside list-disc space-y-1">
                  {resultado.avisos.map((aviso, i) => (
                    <li key={i}>{aviso}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Vst(1)</TableHead>
                    <TableHead className="text-right">VarDiaV(1)</TableHead>
                    <TableHead className="text-right">Prz(4)Ref30d</TableHead>
                    <TableHead className="text-right">Pmp(7)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.produtos.map((p) => (
                    <TableRow key={p.produto}>
                      <TableCell className="font-medium">{p.produto}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarNumeroBr(p.valor_vista)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarPercentualBr(p.variacao_dia_vista)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarNumeroBr(p.valor_prazo_30d)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarNumeroBr(p.prazo_medio_pagamento)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Confira os dados extraídos antes de confirmar. Ao confirmar, os registros existentes
              para a mesma data, região e produto serão atualizados (upsert).
            </p>
          </div>
        )}

        {etapa === "salvando" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Salvando cotações…</p>
          </div>
        )}

        {etapa === "concluido" && mensagemFinal && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            {mensagemFinal.ok ? (
              <CheckCircle2 className="size-10 text-positivo" />
            ) : (
              <XCircle className="size-10 text-destructive" />
            )}
            <p className="max-w-md text-sm text-foreground">{mensagemFinal.texto}</p>
          </div>
        )}

        <DialogFooter>
          {etapa === "revisao" && (
            <>
              <Button variant="outline" onClick={resetar}>
                Cancelar
              </Button>
              <Button onClick={() => void confirmarImportacao()}>Confirmar importação</Button>
            </>
          )}
          {etapa === "concluido" && (
            <>
              <Button variant="outline" onClick={resetar}>
                Importar outro arquivo
              </Button>
              <Button onClick={() => fechar(false)}>Fechar</Button>
            </>
          )}
          {(etapa === "selecao" || etapa === "processando") && (
            <Button variant="outline" onClick={() => fechar(false)}>
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
