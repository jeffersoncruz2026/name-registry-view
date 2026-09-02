import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUTOS_CEPEA } from "@/lib/cepea/types";
import type { FiltrosCotacoes } from "@/hooks/useCepeaCotacoes";

export function FiltrosPainel({
  filtros,
  onFiltrosChange,
  onImportar,
  onExportar,
  exportando,
}: {
  filtros: FiltrosCotacoes;
  onFiltrosChange: (filtros: FiltrosCotacoes) => void;
  onImportar: () => void;
  onExportar: () => void;
  exportando: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data-inicial" className="text-xs">
            Data inicial
          </Label>
          <Input
            id="data-inicial"
            type="date"
            value={filtros.dataInicial ?? ""}
            onChange={(e) => onFiltrosChange({ ...filtros, dataInicial: e.target.value || null })}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data-final" className="text-xs">
            Data final
          </Label>
          <Input
            id="data-final"
            type="date"
            value={filtros.dataFinal ?? ""}
            onChange={(e) => onFiltrosChange({ ...filtros, dataFinal: e.target.value || null })}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="produto" className="text-xs">
            Produto
          </Label>
          <Select
            value={filtros.produto}
            onValueChange={(valor) =>
              onFiltrosChange({ ...filtros, produto: valor as FiltrosCotacoes["produto"] })
            }
          >
            <SelectTrigger id="produto" className="w-[170px]">
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os produtos</SelectItem>
              {PRODUTOS_CEPEA.map((produto) => (
                <SelectItem key={produto} value={produto}>
                  {produto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onExportar} disabled={exportando}>
          <Download className="size-4" />
          {exportando ? "Exportando…" : "Exportar CSV"}
        </Button>
        <Button onClick={onImportar}>
          <Upload className="size-4" />
          Importar PDF
        </Button>
      </div>
    </div>
  );
}
