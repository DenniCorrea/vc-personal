"use client";

import { useActionState } from "react";
import { trocarSenha, type EstadoTrocarSenha } from "./actions";

const estadoInicial: EstadoTrocarSenha = {};

export function TrocarSenhaForm() {
  const [estado, formAction, pendente] = useActionState(trocarSenha, estadoInicial);

  if (estado.sucesso) {
    return <p className="mt-2 text-[13px] text-accent">Senha alterada com sucesso.</p>;
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-[13px] text-ink">
        Senha atual
        <input
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          className="border-0 border-b border-line bg-transparent px-0 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] text-ink">
        Nova senha
        <input
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="border-0 border-b border-line bg-transparent px-0 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] text-ink">
        Confirmar nova senha
        <input
          name="confirmarNovaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="border-0 border-b border-line bg-transparent px-0 py-2 text-ink outline-none focus:border-accent"
        />
      </label>

      {estado.erro && <p className="text-[12px] text-warn">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="mt-1 self-start rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
