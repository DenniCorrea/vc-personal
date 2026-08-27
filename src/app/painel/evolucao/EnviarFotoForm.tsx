"use client";

import { useRef, useState, useTransition } from "react";
import { reduzirImagem } from "@/lib/imagem-cliente";
import { enviarFotoProgresso } from "./actions";

// Formulario de foto de progresso. Precisa ser client component por dois
// motivos: reduzir a imagem antes de enviar (ver src/lib/imagem-cliente.ts)
// e mostrar erro/progresso na propria tela — erro lancado dentro de Server
// Action chega ao usuario em producao como pagina de erro generica, entao
// o estado tem que ser tratado aqui.
export function EnviarFotoForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();

  async function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formulario = evento.currentTarget;
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) {
      setErro("Escolha uma foto.");
      return;
    }

    setPreparando(true);
    const resultado = await reduzirImagem(arquivo);
    setPreparando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    const dados = new FormData();
    dados.set("foto", resultado.arquivo);
    dados.set("legenda", String(new FormData(formulario).get("legenda") ?? ""));

    iniciarEnvio(async () => {
      try {
        await enviarFotoProgresso(dados);
        formulario.reset();
      } catch {
        setErro("Não consegui enviar a foto agora. Tente de novo em instantes.");
      }
    });
  }

  const ocupado = preparando || enviando;

  return (
    <form onSubmit={aoEnviar} className="mt-3 flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        name="foto"
        accept="image/*"
        required
        onChange={() => setErro(null)}
        className="text-[12px] text-ink-soft file:mr-3 file:rounded-[2px] file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:uppercase file:text-accent-ink"
      />
      <input
        type="text"
        name="legenda"
        placeholder="ex: semana 6 · frente"
        className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
        style={{ background: "var(--color-input)" }}
      />

      {erro && <p className="text-[12px] text-warn">{erro}</p>}

      <button
        type="submit"
        disabled={ocupado}
        className="self-start rounded-[2px] border border-accent-border px-4 py-2 text-[12px] font-medium text-accent disabled:opacity-60"
      >
        {preparando ? "Preparando foto..." : enviando ? "Enviando..." : "Enviar foto"}
      </button>
    </form>
  );
}
