# Livro de Nomes — tela sem banco de dados

## Objetivo
Criar uma única tela responsiva em português para cadastrar e administrar vários nomes, mantendo todos os dados apenas no estado local da página, sem banco de dados.

## Implementação
- Aplicar a direção visual “Midnight ledger”: fundo escuro, tipografia editorial, detalhes dourados e lista compacta.
- Criar cadastro individual por campo de texto, botão e tecla Enter.
- Criar inclusão em massa por uma área expansível, aceitando nomes separados por linha ou vírgula.
- Exibir contador total, busca em tempo real e lista numerada.
- Permitir editar, salvar/cancelar edição e excluir cada nome.
- Adicionar ação para limpar toda a lista, com confirmação, e estados vazios adequados.
- Manter os nomes somente em memória: ao recarregar a página, a lista volta ao estado inicial vazio.
- Garantir layout adaptado para celular e desktop, foco visível, rótulos acessíveis e animações reduzidas quando o sistema solicitar.
- Atualizar metadados da rota com título e descrição específicos.

## Arquivos principais
- `src/routes/index.tsx`: interface e comportamento da lista.
- `src/styles.css`: tokens visuais, fontes, animações e base responsiva.
- `src/routes/__root.tsx`: carregamento das fontes e metadados globais genéricos.