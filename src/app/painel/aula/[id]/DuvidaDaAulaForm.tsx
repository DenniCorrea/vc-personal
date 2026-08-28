"use client";

import { useState } from "react";
import { enviarDuvidaDaAula } from "../actions";

// CTA primario da tela do player: "Enviar dúvida desta aula ao Victor"
// (handoff, 5c/5f). Abre um campo inline em vez de levar pra outra tela —
// o ponto do recurso e a pessoa nao perder o contexto do que acabou de
// assistir.
//
// O minuto do video ainda NAO e capturado automaticamente: o iframe do
// Vimeo so entrega o tempo corrente via player.js (SDK deles), que ainda
// nao esta no projeto. Ate lá o campo e opcional e preenchido a mão — e
// melhor do que prometer uma ancora que nao existe.
export function DuvidaDaAulaForm({
  aulaId,
  jaEnviou,
  respondida,
}: {
  aulaId: string;
  jaEnviou: boolean;
  respondida: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const enviar = enviarDuvidaDaAula.bind(null, aulaId);

  if (!aberto) {
    return (
      <div className="sm:order-1">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full rounded-[2px] bg-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover sm:w-auto"
        >
          Enviar dúvida desta aula
        </button>
        {jaEnviou && (
          <p className="mt-1.5 text-[12px] text-ink-faint">
            {respondida ? "O Victor já respondeu — veja em Fale com o Victor." : "Dúvida enviada, aguardando resposta."}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={enviar} className="w-full rounded-[4px] border border-accent-border bg-card p-4 sm:order-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Dúvida sobre esta aula
      </p>
      <textarea
        name="texto"
        rows={3}
        required
        autoFocus
        placeholder="O que ficou em aberto?"
        className="mt-2 w-full rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
        style={{ background: "var(--color-input)" }}
      />
      <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
        Minuto do vídeo (opcional)
        <input
          name="timestampSegundos"
          type="number"
          min={0}
          placeholder="em segundos"
          className="w-[130px] rounded-[2px] border border-line px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
      </label>
      <div className="mt-3 flex gap-2.5">
        <button
          type="submit"
          className="rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
        >
          Enviar ao Victor
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
