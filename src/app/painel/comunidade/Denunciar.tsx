"use client";

import { useActionState, useState } from "react";
import { denunciar, type EstadoDenuncia } from "./actions";
import { ROTULO_MOTIVO } from "@/lib/moderacao";

const MOTIVOS = ["SPAM", "OFENSA", "CONTEUDO_IMPROPRIO", "FORA_DO_TEMA", "OUTRO"] as const;

// Botao discreto de propósito: fica em cinza claro, sem contorno, ao lado das
// outras acoes. Denuncia nao e uma acao que se queira estimular — tem que
// estar la quando precisa, sem virar o elemento mais chamativo do card.
export function Denunciar({ alvo }: { alvo: { postId: string } | { comentarioId: string } }) {
  const [aberto, setAberto] = useState(false);
  const acao = denunciar.bind(null, alvo);
  const [estado, enviar] = useActionState<EstadoDenuncia, FormData>(acao, {});

  if (estado.enviada) {
    return (
      <p className="text-[12px] text-ink-faint" role="status">
        Denúncia enviada ao Victor.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-[12px] text-ink-faint hover:text-warn"
      >
        Denunciar
      </button>
    );
  }

  return (
    <form action={enviar} className="flex flex-wrap items-center gap-2">
      <select
        name="motivo"
        required
        defaultValue=""
        className="rounded-[2px] border border-line px-2 py-1 text-[12px] text-ink outline-none focus:border-accent"
        style={{ background: "var(--color-input)" }}
      >
        <option value="" disabled>
          Motivo…
        </option>
        {MOTIVOS.map((m) => (
          <option key={m} value={m}>
            {ROTULO_MOTIVO[m]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-[2px] border border-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-warn hover:text-warn"
      >
        Enviar
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="text-[12px] text-ink-faint hover:text-ink"
      >
        Cancelar
      </button>
      {estado.erro && (
        <span role="alert" className="text-[12px] text-warn">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
