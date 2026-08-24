"use client";

import { useState } from "react";
import { registrarCheckinNutricional } from "./actions";

type Props = {
  refeicaoId: string;
  nome: string;
  horario: string | null;
  composicao: string;
};

export function CheckinForm({ refeicaoId, nome, horario, composicao }: Props) {
  const [adaptou, setAdaptou] = useState(false);

  return (
    <section
      className="rounded-[4px] border border-accent-border p-5"
      style={{ background: "linear-gradient(160deg, rgba(201,168,124,0.08), rgba(201,168,124,0.02))" }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[17px] font-semibold text-ink">{nome}</p>
        {horario && <p className="text-[12px] text-ink-soft">{horario}</p>}
      </div>
      <p className="mt-1 text-[13px] text-ink-soft">{composicao}</p>

      {!adaptou ? (
        <div className="mt-4 flex flex-col gap-2">
          <form action={registrarCheckinNutricional}>
            <input type="hidden" name="refeicaoId" value={refeicaoId} />
            <input type="hidden" name="status" value="SEGUIU" />
            <button
              type="submit"
              className="w-full rounded-[2px] bg-accent py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-hover"
            >
              Segui o planejamento
            </button>
          </form>
          <button
            type="button"
            onClick={() => setAdaptou(true)}
            className="w-full rounded-[2px] border border-line py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink hover:border-accent-border"
          >
            Fiz adaptações
          </button>
        </div>
      ) : (
        <form action={registrarCheckinNutricional} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="refeicaoId" value={refeicaoId} />
          <input type="hidden" name="status" value="ADAPTOU" />
          <label className="text-[12px] font-medium text-ink-subtle">O que mudou?</label>
          <textarea
            name="observacaoAdaptacao"
            required
            rows={3}
            className="rounded-[2px] border border-line px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
          <p className="text-[11px] text-ink-faint">Victor lê as adaptações no fim do dia.</p>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setAdaptou(false)}
              className="rounded-[2px] border border-line px-4 py-2 text-[12px] text-ink"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-[2px] bg-accent py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-ink"
            >
              Enviar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
