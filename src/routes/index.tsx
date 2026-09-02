import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";

type NameEntry = {
  id: number;
  name: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livro de Nomes — Cadastro rápido" },
      {
        name: "description",
        content: "Cadastre, busque e edite vários nomes em uma lista simples e temporária.",
      },
      { property: "og:title", content: "Livro de Nomes — Cadastro rápido" },
      {
        property: "og:description",
        content: "Uma tela simples para organizar vários nomes, sem banco de dados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NameRegistry,
});

function NameRegistry() {
  const [names, setNames] = useState<NameEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const nextId = useRef(1);

  const filteredNames = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return names;
    return names.filter((entry) => entry.name.toLocaleLowerCase("pt-BR").includes(term));
  }, [names, search]);

  function addEntries(values: string[]) {
    const normalized = values.map((value) => value.trim()).filter(Boolean);
    if (normalized.length === 0) return;

    const entries = normalized.map((name) => ({ id: nextId.current++, name }));
    setNames((current) => [...current, ...entries]);
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addEntries([newName]);
    setNewName("");
  }

  function handleBulkAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addEntries(bulkNames.split(/[\n,;]+/));
    setBulkNames("");
    setBulkOpen(false);
  }

  function startEditing(entry: NameEntry) {
    setEditingId(entry.id);
    setEditingName(entry.name);
  }

  function saveEditing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = editingName.trim();
    if (!normalized || editingId === null) return;
    setNames((current) =>
      current.map((entry) => (entry.id === editingId ? { ...entry, name: normalized } : entry)),
    );
    setEditingId(null);
    setEditingName("");
  }

  function removeName(id: number) {
    setNames((current) => current.filter((entry) => entry.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function clearAll() {
    if (window.confirm("Deseja excluir todos os nomes da lista?")) {
      setNames([]);
      setSearch("");
      setEditingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background font-body text-foreground antialiased selection:bg-primary/25 selection:text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="animate-rise flex items-end justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase text-primary">Cadastro temporário</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl">Livro de Nomes</h1>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              Cadastre, busque e edite. A lista é apagada ao recarregar a página.
            </p>
          </div>
          <div className="shrink-0 text-right" aria-live="polite">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Total</p>
            <p className="font-display text-4xl leading-none text-primary">{names.length}</p>
          </div>
        </header>

        <section className="mt-8 space-y-4" aria-label="Adicionar nomes">
          <form onSubmit={handleAdd} className="animate-rise-delayed">
            <label htmlFor="new-name" className="mb-2 block font-mono text-[10px] uppercase text-muted-foreground">
              Adicionar nome
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="new-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Digite um nome e pressione Enter…"
                autoComplete="off"
                className="min-w-0 flex-1 border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </form>

          <div className="animate-rise-more-delayed">
            <label htmlFor="search" className="mb-2 block font-mono text-[10px] uppercase text-muted-foreground">
              Buscar
            </label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar a lista…"
              className="w-full border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setBulkOpen((current) => !current)}
            aria-expanded={bulkOpen}
            className="font-mono text-[11px] uppercase text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            {bulkOpen ? "Fechar cadastro em massa" : "Colar lista em massa"}
          </button>

          {bulkOpen && (
            <form onSubmit={handleBulkAdd} className="animate-slidein border-l-2 border-primary bg-card/60 p-4">
              <label htmlFor="bulk-names" className="mb-2 block text-sm font-medium text-foreground">
                Um nome por linha
              </label>
              <textarea
                id="bulk-names"
                rows={5}
                value={bulkNames}
                onChange={(event) => setBulkNames(event.target.value)}
                placeholder={"Ana Beatriz\nBruno Lima\nCamila Rocha"}
                className="w-full resize-y border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!bulkNames.trim()}
                  className="bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Adicionar lista
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="mt-10" aria-labelledby="list-title">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
            <h2 id="list-title" className="font-mono text-[10px] uppercase text-muted-foreground">Lista</h2>
            <div className="flex items-center gap-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                {search ? `${filteredNames.length} de ${names.length}` : `${names.length} ${names.length === 1 ? "nome" : "nomes"}`}
              </p>
              {names.length > 0 && (
                <button type="button" onClick={clearAll} className="font-mono text-[10px] uppercase text-destructive transition-colors hover:text-destructive/75">
                  Limpar tudo
                </button>
              )}
            </div>
          </div>

          {filteredNames.length > 0 ? (
            <ol className="divide-y divide-border">
              {filteredNames.map((entry, index) => (
                <li key={entry.id} className="animate-slidein group flex min-h-16 items-center gap-3 py-3.5 transition-colors hover:bg-secondary/60">
                  <span className="w-7 shrink-0 font-mono text-[11px] text-primary/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {editingId === entry.id ? (
                    <form onSubmit={saveEditing} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                      <label htmlFor={`edit-${entry.id}`} className="sr-only">Editar nome</label>
                      <input
                        id={`edit-${entry.id}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        autoFocus
                        className="min-w-0 flex-1 border-b border-primary bg-transparent px-1 py-1 font-display text-2xl outline-none"
                      />
                      <div className="flex gap-1">
                        <button type="submit" className="px-2 py-1 font-mono text-[11px] uppercase text-primary hover:text-accent">Salvar</button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-2 py-1 font-mono text-[11px] uppercase text-muted-foreground hover:text-foreground">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 break-words font-display text-2xl text-foreground">{entry.name}</span>
                      <div className="flex shrink-0 items-center">
                        <button type="button" onClick={() => startEditing(entry)} className="px-2 py-1 font-mono text-[11px] uppercase text-muted-foreground transition-colors hover:text-primary">Editar</button>
                        <button type="button" onClick={() => removeName(entry.id)} className="px-2 py-1 font-mono text-[11px] uppercase text-muted-foreground transition-colors hover:text-destructive">Excluir</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <div className="animate-fadein border border-border bg-card/40 p-8 text-center">
              <p className="font-mono text-[10px] uppercase text-primary">{search ? "Nenhum resultado" : "Lista vazia"}</p>
              <p className="mt-3 font-display text-2xl italic text-foreground/80">
                {search ? "Nenhum nome encontrado." : "Nenhum nome ainda."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Tente buscar por outro termo." : "Digite acima ou cole uma lista para começar."}
              </p>
            </div>
          )}
        </section>

        <footer className="mt-12 flex items-center justify-between border-t border-border pt-5 font-mono text-[10px] uppercase text-muted-foreground">
          <span>Livro de Nomes</span>
          <span>Sem banco de dados</span>
        </footer>
      </div>
    </main>
  );
}
