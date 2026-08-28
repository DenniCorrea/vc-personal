"use client";

import { useActionState } from "react";
import { agendarSessao, type EstadoAgendamento } from "./actions";

const estadoInicial: EstadoAgendamento = {};

type Mentorado = { id: string; nome: string; plano: string };

// Formulario de marcar sessao como CLIENT component com useActionState.
//
// Nao e capricho: erro lancado dentro de Server Action chega ao usuario em
// producao como pagina de erro generica ("This page couldn't load"), sem a
// mensagem. E aqui a mensagem e o valor — "Conflito: voce ja tem sessao com
// Fulano as 14h" e exatamente o que o Victor precisa ler pra corrigir.
// Regra ja registrada no CLAUDE.md; esta tela caiu nela na auditoria.
export function MarcarSessaoForm({ mentorados, dataPadrao }: { mentorados: Mentorado[]; dataPadrao: string }) {
  const [estado, formAction, pendente] = useActionState(agendarSessao, estadoInicial);

  if (mentorados.length === 0) {
    return <p className="mt-3 text-[13px] text-ink-soft">Nenhum mentorado com assinatura ativa ainda.</p>;
  }

  return (
    <form action={formAction}>
      <label className="mt-4 flex flex-col gap-1 text-[13px] font-medium text-ink">
        Mentorado
        <select
          name="usuarioId"
          required
          className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        >
          {mentorados.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} · {m.plano}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 flex flex-col gap-1 text-[13px] font-medium text-ink">
        Data
        <input
          name="data"
          type="date"
          required
          defaultValue={dataPadrao}
          className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
      </label>

      <div className="mt-3 flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-[13px] font-medium text-ink">
          Horário
          <input
            name="hora"
            type="time"
            required
            defaultValue="14:00"
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex w-[110px] flex-col gap-1 text-[13px] font-medium text-ink">
          Duração
          <select
            name="duracaoMinutos"
            defaultValue="60"
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </label>
      </div>

      {estado.erro && (
        <p
          className="mt-3 rounded-[2px] border px-3 py-2.5 text-[13px]"
          style={{ borderColor: "var(--color-warn)", color: "var(--color-warn)" }}
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p className="mt-3 text-[13px] text-accent">Sessão marcada. O mentorado já foi avisado.</p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 w-full rounded-[2px] bg-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pendente ? "Marcando..." : "Marcar e avisar"}
      </button>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
        O mentorado é avisado na hora, e recebe lembretes 24h, 1h, 30min e 10min antes.
      </p>
    </form>
  );
}
