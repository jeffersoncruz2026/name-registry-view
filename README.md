# Cotações CEPEA Goiânia

Aplicação web privada para importar PDFs do Compacto de Preços do CEPEA, extrair
somente os dados da região **GO-Goiânia** (Boi Gordo, Vaca Gorda, Boi Magro e
Bezerro), armazenar o histórico no Supabase e apresentar as cotações em um
painel gerencial.

This project was built with [Lovable](https://lovable.dev).

## Stack

- React + TypeScript + TanStack Start (SSR) + Tailwind CSS
- Supabase (Auth, banco de dados e Row Level Security)
- pdfjs-dist para leitura do texto dos PDFs
- Recharts para os gráficos

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode a migração em `supabase/migrations/0001_init.sql` (SQL Editor do
   Supabase ou `supabase db push`) para criar as tabelas `cepea_cotacoes` e
   `cepea_importacoes`, com as políticas de RLS restritas a usuários
   autenticados.
3. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (Project Settings > API).
4. Crie os usuários manualmente pelo painel do Supabase (Authentication >
   Users). **Não há cadastro público** — o login é feito apenas por e-mail e
   senha já provisionados.

## Desenvolvimento

Prefer working locally? You need Node.js/Bun — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
or use [Bun](https://bun.sh).

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
cp .env.example .env   # preencha com suas credenciais do Supabase
bun run dev
```

## Funcionalidades

- Login privado por e-mail/senha (Supabase Auth), sem cadastro público.
- Importação manual de PDF do Compacto de Preços CEPEA, com extração restrita
  à região GO-Goiânia, tela de conferência antes de salvar e upsert
  anti-duplicidade (`data_cotacao` + `região` + `produto`).
- Histórico de importações (`/importacoes`) com status de cada tentativa.
- Painel principal (`/`) com filtros de data/produto, cards das últimas
  cotações à vista, gráfico de evolução, tabela histórica paginada e
  exportação em CSV.
- Área reservada "Automação CEPEA" (`/configuracoes/automacao`) — hoje é
  apenas um placeholder; a importação continua manual e o app nunca
  solicita/armazena credenciais do site da CEPEA.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5da0d23b-e49e-4b46-a3c3-def68a4370a6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
