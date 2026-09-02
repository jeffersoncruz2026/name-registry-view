import type {
  CepeaCotacao,
  CepeaCotacaoInsert,
  CepeaImportacao,
  CepeaImportacaoInsert,
} from "@/lib/cepea/types";

export type Database = {
  public: {
    Tables: {
      cepea_cotacoes: {
        Row: CepeaCotacao;
        Insert: CepeaCotacaoInsert & Partial<Pick<CepeaCotacao, "importado_em" | "created_at">>;
        Update: Partial<CepeaCotacaoInsert>;
        Relationships: [];
      };
      cepea_importacoes: {
        Row: CepeaImportacao;
        Insert: CepeaImportacaoInsert & Partial<Pick<CepeaImportacao, "importado_em">>;
        Update: Partial<CepeaImportacaoInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
