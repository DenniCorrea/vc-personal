import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarMensagemAluno, marcarMensagensComoLidas } from "./actions";

// "15:32" a partir do segundo guardado. Mono de proposito — e contador de
// tempo, o unico uso do monoespacado no design (handoff, Tipografia).
function minutoDoVideo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function PaginaMensagens() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const mensagens = await prisma.mensagem.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { criadoEm: "asc" },
    include: { aula: { select: { id: true, titulo: true, modulo: { select: { titulo: true } } } } },
  });

  await marcarMensagensComoLidas();

  return (
    <main className="flex min-h-dvh flex-col pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mensagens</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">Victor Carvalho</h1>
      <p className="text-[12px] text-ink-faint">Responde em até 12h</p>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {mensagens.map((mensagem) => {
          const enviadaPeloAluno = mensagem.autorId === session.user.id;
          return (
            <div
              key={mensagem.id}
              className={`flex flex-col ${enviadaPeloAluno ? "items-end" : "items-start"}`}
            >
              {/* Ancora na aula (handoff 5f): card clicavel acima da bolha,
                  com modulo, aula e o minuto. E o que liga a conversa ao
                  ponto exato do video que gerou a duvida. */}
              {mensagem.aula && (
                <Link
                  href={`/painel/aula/${mensagem.aula.id}`}
                  className="mb-1 max-w-[280px] rounded-[4px] border border-line px-3 py-2 hover:border-accent-border"
                  style={{ background: "var(--color-card)" }}
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Anexado à aula
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink">
                    {mensagem.aula.modulo.titulo} · {mensagem.aula.titulo}
                  </p>
                  {mensagem.timestampSegundos !== null && (
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      {minutoDoVideo(mensagem.timestampSegundos)}
                    </p>
                  )}
                </Link>
              )}
              <div
                className="max-w-[280px] px-4 py-2.5 text-[14px] text-ink"
                style={{
                  background: enviadaPeloAluno ? "rgba(203,163,92,0.14)" : "var(--color-card-alt)",
                  border: enviadaPeloAluno ? "1px solid var(--color-accent-border)" : "none",
                  borderRadius: enviadaPeloAluno ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                }}
              >
                {mensagem.texto}
              </div>
            </div>
          );
        })}
        {mensagens.length === 0 && (
          <p className="text-[13px] text-ink-soft">Nenhuma mensagem ainda — mande um oi pro Victor.</p>
        )}
      </div>

      <form
        action={enviarMensagemAluno}
        className="fixed inset-x-0 mx-auto flex max-w-[520px] items-center gap-2 border-t border-line px-4 py-3"
        style={{ background: "rgba(16,15,13,0.94)", bottom: "calc(76px + env(safe-area-inset-bottom))" }}
      >
        <input
          name="texto"
          required
          placeholder="Escreva uma mensagem..."
          autoComplete="off"
          className="flex-1 rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover"
        >
          →
        </button>
      </form>
    </main>
  );
}
