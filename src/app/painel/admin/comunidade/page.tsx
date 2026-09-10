import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import {
  alternarDestaquePost,
  alternarOcultarPost,
  alternarOcultarComentario,
  comentar,
  resolverDenuncia,
  liberarMentorado,
} from "@/app/painel/comunidade/actions";
import { ROTULO_MOTIVO, lerSilenciamento } from "@/lib/moderacao";
import { PainelSilenciar } from "./PainelSilenciar";

const formatoQuando = formatador({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const ROTULO_TIPO: Record<string, string> = {
  RESULTADO: "Resultado",
  DUVIDA: "Dúvida",
  GERAL: "Geral",
};

// Moderacao da comunidade (handoff, tela 6e). O bloco de cima e o produto
// aqui: "aguardando sua resposta" — posts que ninguem da equipe respondeu,
// ordenados pelo mais antigo, com o campo de resposta ali mesmo.
export default async function PaginaAdminComunidade() {
  await exigirPapel("ADMIN");

  const posts = await prisma.post.findMany({
    orderBy: { criadoEm: "desc" },
    take: 100,
    include: {
      autor: { select: { nome: true } },
      comentarios: { select: { autor: { select: { role: true } } } },
      _count: { select: { curtidas: true, comentarios: true } },
    },
  });

  const [denunciasAbertas, comentarios, silenciados] = await Promise.all([
    prisma.denuncia.findMany({
      where: { resolvidoEm: null },
      orderBy: { criadoEm: "asc" },
      include: {
        denunciante: { select: { nome: true } },
        post: { select: { id: true, texto: true, oculto: true, autor: { select: { id: true, nome: true } } } },
        comentario: {
          select: { id: true, texto: true, oculto: true, autor: { select: { id: true, nome: true } } },
        },
      },
    }),
    prisma.comentario.findMany({
      orderBy: { criadoEm: "desc" },
      take: 60,
      include: {
        autor: { select: { id: true, nome: true, role: true } },
        post: { select: { texto: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { comunidadeSilenciadaAte: { gt: new Date() } },
      select: { id: true, nome: true, comunidadeSilenciadaAte: true, comunidadeMotivoSilencio: true },
    }),
  ]);

  const semRespostaDoMentor = posts.filter(
    (p) => !p.oculto && !p.comentarios.some((c) => c.autor.role === "ADMIN"),
  );

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Comunidade</h1>

      {/* Denuncias vem ANTES de tudo: e o unico bloco onde alguem esta
          esperando uma decisao dele sobre conteudo que ja esta no ar. */}
      {denunciasAbertas.length > 0 && (
        <section className="mt-8 rounded-[4px] border p-5" style={{ borderColor: "var(--color-warn)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-warn)" }}>
            Denúncias abertas · {denunciasAbertas.length}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {denunciasAbertas.map((d) => {
              const alvo = d.post ?? d.comentario;
              if (!alvo) return null;
              const ehPost = d.post != null;
              const autor = alvo.autor;
              return (
                <div key={d.id} className="rounded-[3px] border border-line bg-card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[13px] text-ink">
                      <span className="font-medium">{d.denunciante.nome}</span> denunciou{" "}
                      {ehPost ? "um post" : "um comentário"} de{" "}
                      <span className="font-medium">{autor.nome}</span>
                    </p>
                    <span
                      className="rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ background: "var(--color-warn)", color: "#fff" }}
                    >
                      {ROTULO_MOTIVO[d.motivo]}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap rounded-[2px] border-l-2 border-line pl-3 text-[13.5px] leading-relaxed text-ink-soft">
                    {alvo.texto}
                  </p>
                  {d.detalhe && (
                    <p className="mt-1.5 text-[12px] text-ink-faint">Detalhe: {d.detalhe}</p>
                  )}
                  {alvo.oculto && <p className="mt-1.5 text-[12px] text-warn">já está oculto do feed</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
                    <form
                      action={
                        ehPost
                          ? alternarOcultarPost.bind(null, alvo.id, !alvo.oculto)
                          : alternarOcultarComentario.bind(null, alvo.id, !alvo.oculto)
                      }
                    >
                      <button type="submit" className="text-[12px] font-medium text-warn">
                        {alvo.oculto ? "Voltar ao feed" : "Remover do feed"}
                      </button>
                    </form>

                    <form action={resolverDenuncia.bind(null, d.id, "removido")}>
                      <button type="submit" className="text-[12px] font-medium text-accent">
                        Marcar como resolvida
                      </button>
                    </form>

                    <form action={resolverDenuncia.bind(null, d.id, "sem providencia")}>
                      <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                        Não fere as regras
                      </button>
                    </form>
                  </div>

                  <div className="mt-2">
                    <PainelSilenciar usuarioId={autor.id} nome={autor.nome} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {silenciados.length > 0 && (
        <section className="mt-6 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Suspensos da comunidade · {silenciados.length}
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {silenciados.map((u) => {
              const estado = lerSilenciamento(u);
              return (
                <div key={u.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] text-ink">{u.nome}</p>
                    <p className="text-[12px] text-ink-soft">
                      até {formatoQuando.format(u.comunidadeSilenciadaAte!)}
                      {estado.silenciado && estado.motivo && ` · ${estado.motivo}`}
                    </p>
                  </div>
                  <form action={liberarMentorado.bind(null, u.id)}>
                    <button type="submit" className="text-[12px] font-medium text-accent">
                      Liberar agora
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {semRespostaDoMentor.length > 0 && (
        <section
          className="mt-8 rounded-[4px] border border-accent-border p-5"
          style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.10), rgba(203,163,92,0.02))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Aguardando sua resposta · {semRespostaDoMentor.length}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {semRespostaDoMentor.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-[3px] border border-line bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[14px] font-medium text-ink">{p.autor.nome}</p>
                  <p className="text-[12px] text-ink-soft">
                    {ROTULO_TIPO[p.tipo]} · {formatoQuando.format(p.criadoEm)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{p.texto}</p>
                <form action={comentar.bind(null, p.id)} className="mt-3 flex gap-2">
                  <input
                    name="texto"
                    required
                    placeholder="Responder como mentor..."
                    className="min-w-0 flex-1 rounded-[2px] border border-line px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
                    style={{ background: "var(--color-input)" }}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                  >
                    Responder
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">Todos os posts</p>

      {posts.length === 0 ? (
        <div className="mt-3 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">Nenhuma publicação ainda.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-[4px] border border-line">
          <table className="w-full border-collapse text-left" style={{ minWidth: 780 }}>
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-4 py-3 w-[160px]">Autor</th>
                <th className="px-4 py-3 w-[100px]">Tipo</th>
                <th className="px-4 py-3" style={{ minWidth: 220 }}>Trecho</th>
                <th className="px-4 py-3 w-[110px]">Interações</th>
                <th className="px-4 py-3 w-[170px]"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line last:border-0"
                  style={{ opacity: p.oculto ? 0.5 : 1, background: p.destacado ? "var(--color-accent-wash)" : undefined }}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-[14px] text-ink">{p.autor.nome}</p>
                    <p className="text-[12px] text-ink-soft">{formatoQuando.format(p.criadoEm)}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-ink-soft">{ROTULO_TIPO[p.tipo]}</td>
                  <td className="px-4 py-3.5">
                    <p className="max-w-[420px] truncate text-[13px] text-ink-soft">{p.texto}</p>
                    {p.oculto && <span className="text-[11px] text-warn">oculto do feed</span>}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-ink-soft">
                    {p._count.curtidas} · {p._count.comentarios}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={alternarDestaquePost.bind(null, p.id, !p.destacado)}>
                        <button type="submit" className="text-[12px] font-medium text-accent">
                          {p.destacado ? "Tirar destaque" : "Destacar"}
                        </button>
                      </form>
                      <form action={alternarOcultarPost.bind(null, p.id, !p.oculto)}>
                        <button type="submit" className="text-[12px] text-ink-soft hover:text-warn">
                          {p.oculto ? "Mostrar" : "Ocultar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comentarios: ate 10/09/2026 nao existia NENHUMA forma de moderar
          um comentario — o Victor podia ocultar o post inteiro, mas nao a
          frase ofensiva dentro dele. Ocultar o post punia quem escreveu o
          post, que muitas vezes e a vitima. */}
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
        Comentários recentes
      </p>

      {comentarios.length === 0 ? (
        <div className="mt-3 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">Nenhum comentário ainda.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {comentarios.map((c) => (
            <div
              key={c.id}
              className="rounded-[3px] border border-line p-3.5"
              style={{ background: "var(--color-card)", opacity: c.oculto ? 0.55 : 1 }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13.5px] text-ink">
                  {c.autor.nome}
                  {c.autor.role === "ADMIN" && (
                    <span className="ml-2 rounded-[2px] bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                      Você
                    </span>
                  )}
                </p>
                <p className="text-[12px] text-ink-soft">{formatoQuando.format(c.criadoEm)}</p>
              </div>

              <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
                {c.texto}
              </p>
              <p className="mt-1 truncate text-[11.5px] text-ink-faint">
                em resposta a: {c.post.texto}
              </p>
              {c.oculto && <p className="mt-1 text-[11.5px] text-warn">removido do feed</p>}

              {c.autor.role !== "ADMIN" && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
                  <form action={alternarOcultarComentario.bind(null, c.id, !c.oculto)}>
                    <button
                      type="submit"
                      className="text-[12px] font-medium"
                      style={{ color: c.oculto ? "var(--color-accent)" : "var(--color-warn)" }}
                    >
                      {c.oculto ? "Voltar ao feed" : "Remover do feed"}
                    </button>
                  </form>
                  <PainelSilenciar usuarioId={c.autor.id} nome={c.autor.nome} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
        Ocultar tira do feed mas mantém o registro — nada é apagado. A mentalidade da semana
        fica em{" "}
        <Link href="/painel/admin/mensagens" className="text-accent">
          Mentalidade do dia
        </Link>
        .
      </p>
    </main>
  );
}
