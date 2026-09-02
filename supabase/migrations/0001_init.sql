-- Cotações CEPEA Goiânia — schema inicial
-- Tabelas: cepea_cotacoes (histórico de cotações) e cepea_importacoes (log de importações de PDF)
-- Acesso restrito a usuários autenticados (aplicação privada, sem cadastro público).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- cepea_cotacoes
-- ---------------------------------------------------------------------------
create table if not exists public.cepea_cotacoes (
  id uuid primary key default gen_random_uuid(),
  data_cotacao date not null,
  regiao text not null,
  produto text not null,
  valor_vista numeric,
  variacao_dia_vista numeric,
  minimo_vista numeric,
  maximo_vista numeric,
  valor_prazo_30d numeric,
  variacao_dia_prazo numeric,
  minimo_prazo_30d numeric,
  maximo_prazo_30d numeric,
  prazo_medio_pagamento numeric,
  taxa_cdi_mensal numeric,
  nome_arquivo text,
  importado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint cepea_cotacoes_data_regiao_produto_key
    unique (data_cotacao, regiao, produto)
);

create index if not exists cepea_cotacoes_data_cotacao_idx
  on public.cepea_cotacoes (data_cotacao desc);

create index if not exists cepea_cotacoes_produto_idx
  on public.cepea_cotacoes (produto);

comment on table public.cepea_cotacoes is
  'Histórico de cotações CEPEA extraídas do Compacto de Preços, restrito à região GO-Goiânia.';

-- ---------------------------------------------------------------------------
-- cepea_importacoes
-- ---------------------------------------------------------------------------
create table if not exists public.cepea_importacoes (
  id uuid primary key default gen_random_uuid(),
  nome_arquivo text,
  data_cotacao date,
  status text not null,
  quantidade_registros integer,
  mensagem text,
  importado_em timestamptz not null default now()
);

create index if not exists cepea_importacoes_importado_em_idx
  on public.cepea_importacoes (importado_em desc);

comment on table public.cepea_importacoes is
  'Log de tentativas de importação de PDFs do Compacto de Preços CEPEA.';

-- ---------------------------------------------------------------------------
-- Row Level Security — somente usuários autenticados podem ler/gravar.
-- Não há cadastro público; contas são criadas manualmente no painel do Supabase.
-- ---------------------------------------------------------------------------
alter table public.cepea_cotacoes enable row level security;
alter table public.cepea_importacoes enable row level security;

drop policy if exists "cepea_cotacoes_select_authenticated" on public.cepea_cotacoes;
create policy "cepea_cotacoes_select_authenticated"
  on public.cepea_cotacoes
  for select
  to authenticated
  using (true);

drop policy if exists "cepea_cotacoes_insert_authenticated" on public.cepea_cotacoes;
create policy "cepea_cotacoes_insert_authenticated"
  on public.cepea_cotacoes
  for insert
  to authenticated
  with check (true);

drop policy if exists "cepea_cotacoes_update_authenticated" on public.cepea_cotacoes;
create policy "cepea_cotacoes_update_authenticated"
  on public.cepea_cotacoes
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "cepea_cotacoes_delete_authenticated" on public.cepea_cotacoes;
create policy "cepea_cotacoes_delete_authenticated"
  on public.cepea_cotacoes
  for delete
  to authenticated
  using (true);

drop policy if exists "cepea_importacoes_select_authenticated" on public.cepea_importacoes;
create policy "cepea_importacoes_select_authenticated"
  on public.cepea_importacoes
  for select
  to authenticated
  using (true);

drop policy if exists "cepea_importacoes_insert_authenticated" on public.cepea_importacoes;
create policy "cepea_importacoes_insert_authenticated"
  on public.cepea_importacoes
  for insert
  to authenticated
  with check (true);
