"use client";

import { useState } from "react";
import { silenciarMentorado } from "@/app/painel/comunidade/actions";

// Suspender alguem e uma decisao que o Victor vai ter que justificar depois,
// entao o formulario pede prazo E motivo antes de deixar confirmar. Fica
// fechado por padrao: nao e uma acao pra estar a um clique de distancia numa
// tela que ele usa todo dia pra responder gente.
export function PainelSilenciar({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-[12px] text-ink-soft hover:text-warn"
      >
        Suspender autor
      </button>
    );
  }

  return (
    <form
      action={silenciarMentorado.bind(null, usuarioId)}
      className="mt-2 rounded-[3px] border p-3"
      style={{ borderColor: "var(--color-warn)" }}
    >
      <p className="text-[12px] text-ink">
        Suspender <strong>{nome}</strong> de publicar e comentar
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
        O acesso a aulas, bônus e sessões continua — só a voz na comunidade fica suspensa. Ele
        recebe um aviso com o motivo.
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          Por
          <select
            name="dias"
            defaultValue="7"
            className="rounded-[2px] border border-line px-2 py-1 text-[12px] text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          >
            <option value="1">1 dia</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="365">1 ano</option>
          </select>
        </label>
        <input
          name="motivo"
          required
          placeholder="Motivo (ele vai ler isso)"
          className="min-w-0 flex-1 rounded-[2px] border border-line px-2.5 py-1 text-[12px] text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-[2px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ background: "var(--color-warn)", color: "#fff" }}
        >
          Confirmar suspensão
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[12px] text-ink-soft hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
