"use client";

import { useState } from "react";
import { enviarDuvidaDaAula } from "../actions";
import { tempoDaAula, pausar, formatarMinuto } from "./tempoDoPlayer";

// CTA primario da tela do player: "Enviar dúvida desta aula ao Victor"
// (handoff, 5c/5f). Abre um campo inline em vez de levar pra outra tela —
// o ponto do recurso e a pessoa nao perder o contexto do que acabou de
// assistir.
//
// O minuto vem AUTOMATICO do player (ver ./tempoDoPlayer.ts): ao abrir, o
// formulario PERGUNTA o tempo corrente e pausa o video. Antes era digitado
// a mao, o que so funcionava se a pessoa se desse ao trabalho de olhar o
// cronometro — na pratica, quase nunca. Agora o padrao e anexar o ponto
// exato, e ela pode desmarcar se a duvida for sobre a aula toda.
//
// Quando nao ha tempo confiavel (aula sem video, ou video que nunca tocou)
// o campo manual reaparece — melhor pedir do que anexar um minuto errado.
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
  const [minutoCapturado, setMinutoCapturado] = useState<number | null>(null);
  const [anexarMinuto, setAnexarMinuto] = useState(true);
  const enviar = enviarDuvidaDaAula.bind(null, aulaId);

  async function abrir() {
    // Pausa primeiro (resposta imediata ao clique), depois pergunta o tempo
    // ao player. Perguntar no clique da o minuto EXATO do momento em que a
    // pessoa decidiu perguntar — e nao depende de evento continuo, que o
    // navegador estrangula quando a aba nao esta sendo desenhada.
    pausar(aulaId);
    setAnexarMinuto(true);
    setAberto(true);
    setMinutoCapturado(await tempoDaAula(aulaId));
  }

  if (!aberto) {
    return (
      <div className="sm:order-1">
        <button
          type="button"
          onClick={abrir}
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

      {minutoCapturado !== null ? (
        <>
          <label className="mt-2.5 flex items-center gap-2.5 text-[13px] text-ink-soft">
            <input
              type="checkbox"
              checked={anexarMinuto}
              onChange={(e) => setAnexarMinuto(e.target.checked)}
            />
            <span>
              Anexar o minuto{" "}
              <span className="font-mono text-accent">{formatarMinuto(minutoCapturado)}</span>
            </span>
          </label>
          {anexarMinuto && (
            <input type="hidden" name="timestampSegundos" value={minutoCapturado} />
          )}
        </>
      ) : (
        <label className="mt-2.5 flex items-center gap-2 text-[12px] text-ink-soft">
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
      )}

      <textarea
        name="texto"
        rows={3}
        required
        autoFocus
        placeholder="O que ficou em aberto?"
        className="mt-2.5 w-full rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
        style={{ background: "var(--color-input)" }}
      />

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
