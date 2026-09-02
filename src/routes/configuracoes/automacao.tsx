import { createFileRoute } from "@tanstack/react-router";
import { Clock, ShieldOff, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/configuracoes/automacao")({
  head: () => ({
    meta: [{ title: "Automação CEPEA — Cotações CEPEA Goiânia" }],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <PaginaAutomacao />
      </AppShell>
    </RequireAuth>
  ),
});

function PaginaAutomacao() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Automação CEPEA</h1>
        <p className="text-sm text-muted-foreground">
          Área reservada para a futura automação de download e importação dos relatórios CEPEA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Automação de importação</CardTitle>
            <Badge variant="secondary">
              <Clock className="size-3.5" />
              Em breve
            </Badge>
          </div>
          <CardDescription>
            Hoje a importação do Compacto de Preços é sempre manual: você seleciona o PDF pelo
            painel principal e confere os dados antes de salvar. Esta seção ficará disponível para
            configurar, no futuro, um agendamento automático de coleta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Quando implementada, a automação poderá buscar periodicamente o relatório mais recente
              e sugerir a importação — sempre passando pela mesma tela de conferência usada na
              importação manual.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <ShieldOff className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p>
              Por segurança, este aplicativo{" "}
              <strong>nunca solicita nem armazena usuário ou senha do site da CEPEA</strong> no
              navegador. Nenhuma credencial de terceiros é coletada nesta tela nem em nenhuma outra
              parte do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
