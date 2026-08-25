import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarMensagemAluno, marcarMensagensComoLidas } from "./actions";

export default async function PaginaMensagens() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const mensagens = await prisma.mensagem.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { criadoEm: "asc" },
  });

  await marcarMensagensComoLidas();

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-cabecalho-aluno pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mensagens</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">Victor Carvalho</h1>
      <p className="text-[12px] text-ink-faint">Responde em até 12h</p>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {mensagens.map((mensagem) => {
          const enviadaPeloAluno = mensagem.autorId === session.user.id;
          return (
            <div key={mensagem.id} className={`flex ${enviadaPeloAluno ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[280px] px-4 py-2.5 text-[14px] text-ink"
                style={{
                  background: enviadaPeloAluno ? "rgba(201,168,124,0.14)" : "#1A1714",
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
