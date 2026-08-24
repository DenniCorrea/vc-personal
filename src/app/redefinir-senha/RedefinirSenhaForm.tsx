"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { redefinirSenha, type EstadoRedefinirSenha } from "./actions";

const estadoInicial: EstadoRedefinirSenha = {};

export function RedefinirSenhaForm() {
  const [estado, formAction, pendente] = useActionState(redefinirSenha, estadoInicial);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return <p className="mt-2 text-warn">Link inválido — falta o token de recuperação na URL.</p>;
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Nova senha
        <input
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
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
          className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
        />
      </label>

      {estado.erro && <p className="text-sm text-warn">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Definir nova senha"}
      </button>
    </form>
  );
}
