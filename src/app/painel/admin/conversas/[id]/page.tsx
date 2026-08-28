import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarMensagemAdmin } from "../actions";

function minutoDoVideo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function PaginaAdminConversa({ params }: PageProps<"/painel/admin/conversas/[id]">) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const aluno = await prisma.usuario.findFirst({ where: { id, role: { in: ["ALUNO", "PERSONAL_PARCEIRO"] } } });
  if (!aluno) notFound();

  const mensagens = await prisma.mensagem.findMany({
    where: { usuarioId: id },
    orderBy: { criadoEm: "asc" },
    include: { aula: { select: { id: true, titulo: true, modulo: { select: { titulo: true } } } } },
  });

  await prisma.mensagem.updateMany({ where: { usuarioId: id, autorId: id, lida: false }, data: { lida: true } });

  const enviar = enviarMensagemAdmin.bind(null, id);

  return (
    <main className="flex h-[calc(100dvh-72px)] flex-col">
      <p className="font-display text-[24px] text-ink">{aluno.nome}</p>

      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        {mensagens.map((mensagem) => {
          const doAdmin = mensagem.autorId !== id;
          return (
            <div key={mensagem.id} className={`flex flex-col ${doAdmin ? "items-end" : "items-start"}`}>
              {/* Contexto da duvida (handoff 6d): sem isto o Victor le
                  "no exemplo do recorte..." sem saber de qual aula nem de
                  que minuto — responder com contexto E o produto aqui. */}
              {mensagem.aula && (
                <Link
                  href={`/painel/admin/trilha/aula/${mensagem.aula.id}`}
                  className="mb-1 max-w-[420px] rounded-[4px] border border-line px-3 py-2 hover:border-accent-border"
                  style={{ background: "var(--color-card-admin)" }}
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Dúvida ancorada
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink">
                    {mensagem.aula.modulo.titulo} · {mensagem.aula.titulo}
                  </p>
                  {mensagem.timestampSegundos !== null && (
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      minuto {minutoDoVideo(mensagem.timestampSegundos)}
                    </p>
                  )}
                </Link>
              )}
              <div
                className="max-w-[420px] px-4 py-2.5 text-[14px] text-ink"
                style={{
                  background: doAdmin ? "rgba(203,163,92,0.14)" : "var(--color-card-admin)",
                  border: doAdmin ? "1px solid var(--color-accent-border)" : "1px solid var(--color-line)",
                  borderRadius: doAdmin ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                }}
              >
                {mensagem.texto}
              </div>
            </div>
          );
        })}
        {mensagens.length === 0 && <p className="text-[13px] text-ink-soft">Nenhuma mensagem ainda.</p>}
      </div>

      <form action={enviar} className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <input
          name="texto"
          required
          autoComplete="off"
          placeholder="Escreva uma resposta..."
          className="flex-1 rounded-[2px] border border-line px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
          style={{ background: "var(--color-input)" }}
        />
        <button
          type="submit"
          className="rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
