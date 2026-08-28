import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import { alternarCurtida, comentar } from "./actions";
import { ComporPost } from "./ComporPost";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoQuando = formatador({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const ROTULO_TIPO: Record<string, string> = {
  RESULTADO: "Resultado",
  DUVIDA: "Dúvida comercial",
  GERAL: "Geral",
};

// Comunidade dos mentorados (handoff, tela 5e). Feed fechado: so quem tem
// assinatura ativa de MENTORIA le e escreve.
export default async function PaginaComunidade() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    select: { id: true },
  });

  if (!assinatura) {
    return (
      <main className="max-w-lg pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Comunidade</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Você ainda não tem acesso</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          A comunidade é exclusiva de quem tem assinatura ativa.
        </p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const posts = await prisma.post.findMany({
    where: { oculto: false },
    orderBy: [{ destacado: "desc" }, { criadoEm: "desc" }],
    take: 50,
    include: {
      autor: { select: { id: true, nome: true, avatarUrl: true, role: true } },
      curtidas: { select: { usuarioId: true } },
      comentarios: {
        orderBy: { criadoEm: "asc" },
        include: { autor: { select: { nome: true, role: true } } },
      },
    },
  });

  const [mentoradosAtivos, ticketMedio] = await Promise.all([
    prisma.assinatura.count({ where: { status: "ATIVA", plano: { produto: "MENTORIA" } } }),
    prisma.post.aggregate({ where: { ticketDepois: { not: null } }, _avg: { ticketDepois: true } }),
  ]);

  return (
    <main className="pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Comunidade</p>
      <h1 className="font-display mt-1 text-[32px] text-ink md:text-[36px]">Entre mentorados</h1>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <ComporPost />

          <div className="mt-5 flex flex-col gap-4">
            {posts.map((post) => {
              const curti = post.curtidas.some((c) => c.usuarioId === session.user.id);
              const ehResultado = post.tipo === "RESULTADO" && post.ticketAntes != null && post.ticketDepois != null;
              const variacao = ehResultado
                ? Math.round(
                    ((Number(post.ticketDepois) - Number(post.ticketAntes)) / Number(post.ticketAntes)) * 100,
                  )
                : null;

              return (
                <article
                  key={post.id}
                  className="rounded-[4px] border p-5"
                  style={{
                    borderColor: ehResultado ? "var(--color-accent-border)" : "var(--color-line)",
                    background: ehResultado
                      ? "linear-gradient(150deg, rgba(203,163,92,0.09), rgba(203,163,92,0.02))"
                      : "var(--color-card)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent text-[13px] text-accent">
                      {post.autor.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {post.autor.nome}
                        {post.autor.role === "ADMIN" && (
                          <span className="ml-2 rounded-[2px] bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                            Mentor
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-ink-soft">{formatoQuando.format(post.criadoEm)}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                      {ROTULO_TIPO[post.tipo]}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{post.texto}</p>

                  {ehResultado && (
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 rounded-[3px] border border-line p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                          Ticket antes
                        </p>
                        <p className="mt-0.5 text-[18px] font-semibold text-ink-soft">
                          {formatoMoeda.format(Number(post.ticketAntes))}
                        </p>
                      </div>
                      <div className="flex-1 rounded-[3px] border border-accent-border p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                          Ticket depois
                        </p>
                        <p className="mt-0.5 text-[18px] font-semibold text-accent">
                          {formatoMoeda.format(Number(post.ticketDepois))}
                          {variacao !== null && variacao > 0 && (
                            <span className="ml-1.5 text-[13px]">+{variacao}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
                    <form action={alternarCurtida.bind(null, post.id)}>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-[13px]"
                        style={{ color: curti ? "var(--color-accent)" : "var(--color-ink-soft)" }}
                        aria-label={curti ? "Descurtir" : "Curtir"}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={curti ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5c0 5-7 9.5-7 9.5z" />
                        </svg>
                        {post.curtidas.length > 0 && post.curtidas.length}
                      </button>
                    </form>
                    <span className="text-[13px] text-ink-soft">
                      {post.comentarios.length}{" "}
                      {post.comentarios.length === 1 ? "comentário" : "comentários"}
                    </span>
                  </div>

                  {post.comentarios.length > 0 && (
                    <div className="mt-3 flex flex-col gap-3 border-l pl-3.5" style={{ borderColor: "var(--color-accent-border)" }}>
                      {post.comentarios.map((c) => (
                        <div key={c.id}>
                          <p className="text-[13px] font-medium text-ink">
                            {c.autor.nome}
                            {c.autor.role === "ADMIN" && (
                              <span className="ml-2 rounded-[2px] bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                                Mentor
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">{c.texto}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={comentar.bind(null, post.id)} className="mt-3 flex gap-2">
                    <input
                      name="texto"
                      required
                      placeholder="Comentar..."
                      className="min-w-0 flex-1 rounded-[2px] border border-line px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
                      style={{ background: "var(--color-input)" }}
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-[2px] border border-line px-3 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
                    >
                      Enviar
                    </button>
                  </form>
                </article>
              );
            })}

            {posts.length === 0 && (
              <p className="text-[13px] text-ink-soft">
                Nenhuma publicação ainda. Seja o primeiro a compartilhar um resultado.
              </p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[4px] border border-line bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Regras da casa</p>
            <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed text-ink-soft">
              <li>Compartilhe resultado com número — ajuda mais que elogio.</li>
              <li>Dúvida comercial é bem-vinda. Julgamento, não.</li>
              <li>Nada de divulgar serviço de terceiro aqui.</li>
            </ul>
          </section>

          <section className="rounded-[4px] border border-line bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Mentorados ativos</p>
            <p className="mt-2 text-[30px] font-semibold leading-none text-ink" style={{ letterSpacing: "-0.02em" }}>
              {mentoradosAtivos}
            </p>
            {ticketMedio._avg.ticketDepois != null && (
              <p className="mt-2 text-[13px] text-ink-soft">
                Ticket médio relatado:{" "}
                <span className="text-accent">{formatoMoeda.format(Number(ticketMedio._avg.ticketDepois))}</span>
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
