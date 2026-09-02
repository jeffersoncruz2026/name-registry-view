// O app usa o cliente gerado pela integração do backend (Lovable Cloud).
// Este módulo apenas reexporta esse cliente para manter os imports existentes.
export { supabase } from "@/integrations/supabase/client";

export const isSupabaseConfigured = true;
