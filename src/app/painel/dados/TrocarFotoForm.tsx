"use client";

import { useRef, useState, useTransition } from "react";
import { reduzirImagem } from "@/lib/imagem-cliente";
import { enviarAvatar } from "./actions";

// Clicar em "Trocar foto" abre o seletor de arquivo direto, sem botao
// "Salvar" separado (handoff, tela 4a: acao "TROCAR FOTO" ao lado do nome).
//
// A imagem e reduzida no navegador antes de subir — mesma correcao da foto
// de progresso: foto de celular novo passa de 10MB e estourava o limite do
// servidor com uma tela de erro sem explicacao. Ver src/lib/imagem-cliente.ts.
export function TrocarFotoForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [, iniciarEnvio] = useTransition();

  async function aoEscolher() {
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setOcupado(true);
    const resultado = await reduzirImagem(arquivo);

    if (!resultado.ok) {
      setOcupado(false);
      setErro(resultado.erro);
      return;
    }

    const dados = new FormData();
    dados.set("avatar", resultado.arquivo);

    iniciarEnvio(async () => {
      try {
        await enviarAvatar(dados);
      } catch {
        setErro("Não consegui enviar a foto agora. Tente de novo em instantes.");
      } finally {
        setOcupado(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="mt-1">
      <label className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
        {ocupado ? "Enviando..." : "Trocar foto"}
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/*"
          disabled={ocupado}
          className="hidden"
          onChange={aoEscolher}
        />
      </label>
      {erro && <p className="mt-1 text-[12px] text-warn">{erro}</p>}
    </div>
  );
}
