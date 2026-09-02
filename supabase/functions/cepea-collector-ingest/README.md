# cepea-collector-ingest

Edge Function que recebe cotações da região **GO-Goiânia** enviadas por um
agente de coleta automatizado (programa instalado em um computador Windows
autorizado) e grava na mesma tabela `cepea_cotacoes` usada pela importação
manual de PDF — com `upsert` por `data_cotacao + regiao + produto`.

## Autenticação

A função **não** usa sessão de usuário do Supabase Auth (`verify_jwt = false`
em `supabase/config.toml`). Em vez disso, todo request deve enviar o cabeçalho:

```
X-Collector-Key: <segredo>
```

O valor é comparado, no servidor, com o segredo `CEPEA_COLLECTOR_KEY`
configurado nos **Secrets** da função no Supabase — nunca no frontend, nunca
no repositório. Requisições sem a chave, ou com a chave errada, recebem
`401` e não são registradas em `cepea_importacoes` (para não poluir o
histórico de importações com tentativas de acesso indevido).

### Configurar o segredo

Gere um valor aleatório forte, por exemplo:

```bash
openssl rand -hex 32
```

E configure-o no projeto Supabase (painel: *Edge Functions → Secrets*, ou
via CLI):

```bash
supabase secrets set CEPEA_COLLECTOR_KEY=SUBSTITUA_PELO_VALOR_GERADO
```

O mesmo valor deve ser configurado apenas no programa Windows que faz a
coleta — nunca em código-fonte, variável `VITE_*` ou qualquer lugar
acessível pelo navegador.

## Formato da requisição

```
POST /functions/v1/cepea-collector-ingest
Content-Type: application/json
X-Collector-Key: <segredo>
```

```json
{
  "data_cotacao": "2026-09-01",
  "taxa_cdi_mensal": 1.2152,
  "nome_arquivo": "Compacto01-09-2026.pdf",
  "cotacoes": [
    {
      "regiao": "GO-Goiânia",
      "produto": "Boi Gordo",
      "valor_vista": 317.23,
      "variacao_dia_vista": 0.09,
      "minimo_vista": 311.0,
      "maximo_vista": 330.0,
      "valor_prazo_30d": 321.09,
      "variacao_dia_prazo": 0.09,
      "minimo_prazo_30d": 314.78,
      "maximo_prazo_30d": 334.01,
      "prazo_medio_pagamento": 36.2
    }
  ]
}
```

Regras de validação (tudo ou nada — se qualquer produto for inválido,
nada é gravado):

- `data_cotacao`: obrigatória, formato `AAAA-MM-DD`, não pode ser futura.
- `cotacoes`: exatamente 4 itens, um para cada produto distinto entre
  `Boi Gordo`, `Vaca Gorda`, `Boi Magro` e `Bezerro`.
- `regiao`: aceita apenas variações de "GO-Goiânia" (maiúsculas/minúsculas,
  acentos, espaçamento); é normalizada para `GO-Goiânia` antes de salvar.
- Campos numéricos: número ou `null` (representando "nd"); nunca texto.

## Resposta

Sucesso (`200`):

```json
{
  "success": true,
  "data_cotacao": "2026-09-01",
  "registros_processados": 4,
  "mensagem": "Cotações de GO-Goiânia importadas com sucesso."
}
```

Erro (`400`, `401`, `409` ou `500`):

```json
{
  "success": false,
  "mensagem": "Descrição clara do erro."
}
```

## Exemplo de teste (não usar chave real neste arquivo)

```bash
curl -i -X POST "https://SEU-PROJETO.supabase.co/functions/v1/cepea-collector-ingest" \
  -H "Content-Type: application/json" \
  -H "X-Collector-Key: SUBSTITUA_PELA_CHAVE_SECRETA" \
  -d '{
    "data_cotacao": "2026-09-01",
    "taxa_cdi_mensal": 1.2152,
    "nome_arquivo": "Compacto01-09-2026.pdf",
    "cotacoes": [
      { "regiao": "GO-Goiânia", "produto": "Boi Gordo",  "valor_vista": 317.23,  "variacao_dia_vista": 0.09,  "minimo_vista": 311.00,  "maximo_vista": 330.00,  "valor_prazo_30d": 321.09,  "variacao_dia_prazo": 0.09,  "minimo_prazo_30d": 314.78,  "maximo_prazo_30d": 334.01,  "prazo_medio_pagamento": 36.20 },
      { "regiao": "GO-Goiânia", "produto": "Vaca Gorda",  "valor_vista": 304.09,  "variacao_dia_vista": 0.22,  "minimo_vista": 295.11,  "maximo_vista": 311.00,  "valor_prazo_30d": 307.78,  "variacao_dia_prazo": 0.22,  "minimo_prazo_30d": 298.70,  "maximo_prazo_30d": 314.78,  "prazo_medio_pagamento": 36.30 },
      { "regiao": "GO-Goiânia", "produto": "Boi Magro",   "valor_vista": 4392.50, "variacao_dia_vista": 0.46,  "minimo_vista": 4240.00, "maximo_vista": 4580.00, "valor_prazo_30d": 4445.88, "variacao_dia_prazo": 0.46,  "minimo_prazo_30d": 4291.53, "maximo_prazo_30d": 4635.66, "prazo_medio_pagamento": null },
      { "regiao": "GO-Goiânia", "produto": "Bezerro",     "valor_vista": 3137.78, "variacao_dia_vista": -0.04, "minimo_vista": 2850.00, "maximo_vista": 3510.00, "valor_prazo_30d": 3175.91, "variacao_dia_prazo": -0.04, "minimo_prazo_30d": 2884.63, "maximo_prazo_30d": 3552.65, "prazo_medio_pagamento": null }
    ]
  }'
```

Teste de segurança (deve retornar `401`, sem revelar o segredo configurado):

```bash
curl -i -X POST "https://SEU-PROJETO.supabase.co/functions/v1/cepea-collector-ingest" \
  -H "Content-Type: application/json" \
  -H "X-Collector-Key: chave-errada" \
  -d '{}'
```
