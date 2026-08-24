"use client";

import { useState } from "react";
import { responderAnamnese } from "./actions";

const TEMPOS = [
  { valor: "NUNCA_TREINOU", rotulo: "Nunca treinei" },
  { valor: "UM_A_TRES_ANOS", rotulo: "1 a 3 anos" },
  { valor: "MAIS_DE_TRES_ANOS", rotulo: "Mais de 3 anos" },
] as const;

const OBJETIVOS = [
  { valor: "HIPERTROFIA", rotulo: "Hipertrofia" },
  { valor: "EMAGRECIMENTO", rotulo: "Emagrecimento" },
  { valor: "SAUDE_CONSTANCIA", rotulo: "Saúde e constância" },
  { valor: "PERFORMANCE", rotulo: "Performance" },
] as const;

type Props = {
  valoresIniciais?: {
    tempoTreino: string;
    diasDisponiveis: number;
    objetivo: string;
    lesoesRestricoes: string | null;
  };
};

export function AnamneseForm({ valoresIniciais }: Props) {
  const [tempoTreino, setTempoTreino] = useState(valoresIniciais?.tempoTreino ?? "");
  const [dias, setDias] = useState(valoresIniciais?.diasDisponiveis ?? 0);
  const [objetivo, setObjetivo] = useState(valoresIniciais?.objetivo ?? "");

  return (
    <form action={responderAnamnese} className="mt-6 flex flex-col gap-8">
      <input type="hidden" name="tempoTreino" value={tempoTreino} />
      <input type="hidden" name="diasDisponiveis" value={dias} />
      <input type="hidden" name="objetivo" value={objetivo} />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Tempo de treino</p>
        <div className="mt-3 flex flex-col gap-2">
          {TEMPOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setTempoTreino(opcao.valor)}
              className="flex items-center justify-between rounded-[2px] border px-4 py-3 text-left text-[14px] text-ink"
              style={{
                borderColor: tempoTreino === opcao.valor ? "var(--color-accent-border)" : "var(--color-line)",
                background: tempoTreino === opcao.valor ? "var(--color-accent-wash)" : "transparent",
              }}
            >
              {opcao.rotulo}
              {tempoTreino === opcao.valor && <span className="text-accent">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          Dias disponíveis por semana
        </p>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDias(n)}
              className="aspect-square rounded-[2px] border text-[14px] font-medium"
              style={{
                borderColor: dias === n ? "var(--color-accent)" : "var(--color-line)",
                background: dias === n ? "var(--color-accent)" : "transparent",
                color: dias === n ? "var(--color-accent-ink)" : "var(--color-ink)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Objetivo principal</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {OBJETIVOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setObjetivo(opcao.valor)}
              className="rounded-[2px] border px-3 py-3 text-[13px] font-medium"
              style={{
                borderColor: objetivo === opcao.valor ? "var(--color-accent)" : "var(--color-line)",
                background: objetivo === opcao.valor ? "var(--color-ink)" : "transparent",
                color: objetivo === opcao.valor ? "var(--color-paper)" : "var(--color-ink)",
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Lesões ou restrições</p>
        <textarea
          name="lesoesRestricoes"
          defaultValue={valoresIniciais?.lesoesRestricoes ?? ""}
          rows={3}
          placeholder="Ex.: dor no ombro direito ao elevar acima da cabeça."
          className="mt-3 w-full rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
      </div>

      <button
        type="submit"
        disabled={!tempoTreino || !dias || !objetivo}
        className="rounded-[2px] bg-accent py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-ink hover:bg-accent-hover disabled:opacity-40"
      >
        Continuar
      </button>
    </form>
  );
}
