"use client";

import { enviarAvatar } from "./actions";

// Input de arquivo escondido, disparado pelo label — clicar em "Trocar
// foto" abre o seletor de arquivo direto, sem precisar de um botao
// "Salvar" separado (handoff, tela 4a: acao "TROCAR FOTO" ao lado do nome).
export function TrocarFotoForm() {
  return (
    <form action={enviarAvatar} className="mt-1">
      <label className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
        Trocar foto
        <input
          type="file"
          name="avatar"
          accept="image/*"
          required
          className="hidden"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </label>
    </form>
  );
}
