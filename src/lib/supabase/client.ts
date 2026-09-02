import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.",
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// URL de placeholder sintaticamente válida evita que createClient lance exceção
// (e derrube a aplicação inteira) quando as variáveis de ambiente ainda não
// foram configuradas. O aviso acima e a tela de login já sinalizam o problema.
export const supabase = createClient<Database>(
  isSupabaseConfigured ? (supabaseUrl as string) : "https://supabase-nao-configurado.invalid",
  isSupabaseConfigured ? (supabaseAnonKey as string) : "chave-nao-configurada",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
