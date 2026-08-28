"use client";

import { useState } from "react";
import { publicarPost } from "./actions";

// Composer do feed (handoff 5e). Os campos de ticket so aparecem quando o
// tipo e RESULTADO — pedir "ticket antes/depois" numa duvida comercial nao
// faz sentido e so atrapalha.
const TIPOS = [
  { valor: "RESULTADO", rotulo: "Resultado" },
  { valor: "DUVIDA", rotulo: "Dúvida" },
  { valor: "GERAL", rotulo: "Geral" },
] as const;

export function ComporPost() {
  const [tipo, setTipo] = useState<string>("GERAL");
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(dados: FormData) {
    setErro(null);
    try {
      await publicarPost(dados);
      setTipo("GERAL");
    } catch (e) {
      // Erro lancado em Server Action chega ao usuario como pagina generica
      // em producao — por isso o estado fica aqui (regra do CLAUDE.md).
      setErro(e instanceof Error ? e.message : "Não consegui publicar agora.");
    }
  }

  return (
    <form action={aoEnviar} className="rounded-[4px] border border-line bg-card p-5">
      <textarea
        name="texto"
        rows={3}
        required
        placeholder="Compartilhe um resultado, uma dúvida comercial ou um caso de cliente…"
        className="w-full rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
        style={{ background: "var(--color-input)" }}
      />

      <input type="hidden" name="tipo" value={tipo} />
      <div className="mt-3 flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => setTipo(t.valor)}
            className="min-h-10 rounded-[2px] border px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              borderColor: tipo === t.valor ? "var(--color-accent)" : "var(--color-line)",
              color: tipo === t.valor ? "var(--color-accent)" : "var(--color-ink-soft)",
              background: tipo === t.valor ? "var(--color-accent-wash)" : "transparent",
            }}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      {tipo === "RESULTADO" && (
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex flex-1 flex-col gap-1 text-[12px] text-ink-soft" style={{ minWidth: 140 }}>
            Ticket antes (R$)
            <input
              name="ticketAntes"
              type="number"
              min={0}
              step="0.01"
              className="rounded-[2px] border border-line px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[12px] text-ink-soft" style={{ minWidth: 140 }}>
            Ticket depois (R$)
            <input
              name="ticketDepois"
              type="number"
              min={0}
              step="0.01"
              className="rounded-[2px] border border-accent-border px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
          </label>
        </div>
      )}

      {erro && <p className="mt-3 text-[12px] text-warn">{erro}</p>}

      <button
        type="submit"
        className="mt-4 rounded-[2px] bg-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
      >
        Publicar
      </button>
    </form>
  );
}
