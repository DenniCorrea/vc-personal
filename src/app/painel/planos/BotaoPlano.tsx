"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoPlano } from "./actions";

// O botao de cada card do catalogo.
//
// Existe como client component por dois motivos, os dois vindos do bug de
// 10/09/2026:
//
// 1. `useActionState` — erro devolvido pela acao aparece NO CARD. Antes a
//    acao lancava `throw`, o Next mascarava em producao e a pessoa via a
//    tela de erro do framework em vez do motivo.
// 2. `useFormStatus` — enquanto a troca roda, o botao vira "Trocando...' e
//    fica desabilitado. Sem isso a tela ficava identica durante e depois do
//    clique, e o segundo clique (achando que o primeiro falhou) era
//    justamente o que quebrava.
function Botao({ rotulo, destaque }: { rotulo: string; destaque: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full rounded-[2px] py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: destaque ? "var(--color-accent)" : "transparent",
        color: destaque ? "var(--color-accent-ink)" : "var(--color-ink)",
        border: destaque ? "none" : "1px solid var(--color-line)",
      }}
    >
      {pending ? "Trocando…" : rotulo}
    </button>
  );
}

export function BotaoPlano({
  acao,
  rotulo,
  destaque,
}: {
  acao: (estadoAnterior: EstadoPlano, formData: FormData) => Promise<EstadoPlano>;
  rotulo: string;
  destaque: boolean;
}) {
  const [estado, enviar] = useActionState(acao, {});

  return (
    <form action={enviar} className="mt-5">
      <Botao rotulo={rotulo} destaque={destaque} />
      {estado.erro && (
        <p role="alert" className="mt-2 text-[12px] leading-snug text-warn">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
