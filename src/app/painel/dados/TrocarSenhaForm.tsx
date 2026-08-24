"use client";

import { useActionState } from "react";
import { trocarSenha, type EstadoTrocarSenha } from "./actions";

const estadoInicial: EstadoTrocarSenha = {};

export function TrocarSenhaForm() {
  const [estado, formAction, pendente] = useActionState(trocarSenha, estadoInicial);

  if (estado.sucesso) {
    return <p className="mt-1 text-sm text-accent">Senha alterada com sucesso.</p>;
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Senha atual
        <input
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Nova senha
        <input
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Confirmar nova senha
        <input
          name="confirmarNovaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>

      {estado.erro && <p className="text-sm text-warn">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
