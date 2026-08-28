import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { trilhaDoUsuario } from "@/lib/trilha";
import { marcarConcluida } from "../actions";
import { PlayerAula } from "./PlayerAula";
import { DuvidaDaAulaForm } from "./DuvidaDaAulaForm";

// Player de aula (handoff, tela 5c). Grid 1fr | 360px no desktop; no
// mobile o video vem no topo em largura total e a lista de aulas desce pra
// baixo (RESPONSIVE.md, 5c).
export default async function PaginaAula({ params }: PageProps<"/painel/aula/[id]">) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  const { id } = await params;

  // A trilha ja vem filtrada pelo plano e pelo prazo — se a aula nao estiver
  // aqui, ela nao existe pra esta pessoa (404, nao 403: confirmar que a
  // aula existe mas e de outro plano ja e informacao demais).
  const { modulos } = await trilhaDoUsuario(session.user.id);
  const modulo = modulos.find((m) => m.aulas.some((a) => a.id === id));
  const aula = modulo?.aulas.find((a) => a.id === id);
  if (!modulo || !aula) notFound();

  const indice = modulo.aulas.findIndex((a) => a.id === id);
  const proxima = modulo.aulas[indice + 1] ?? null;
  const concluida = aula.meuProgresso?.concluida ?? false;

  const duvidaAnterior = await prisma.mensagem.findFirst({
    where: { usuarioId: session.user.id, aulaId: id, autorId: session.user.id },
    orderBy: { criadoEm: "desc" },
    select: { criadoEm: true },
  });
  const respostaDoVictor = duvidaAnterior
    ? await prisma.mensagem.findFirst({
        where: { usuarioId: session.user.id, aulaId: id, autorId: { not: session.user.id } },
        orderBy: { criadoEm: "desc" },
        select: { id: true },
      })
    : null;

  return (
    <main className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/painel/modulos" className="text-[13px] text-ink-soft hover:text-ink">
            ← {modulo.titulo}
          </Link>
          <h1 className="font-display mt-1.5 text-[28px] leading-tight text-ink md:text-[34px]">
            {aula.titulo}
          </h1>
        </div>
        {aula.restam !== null && (
          <span
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[2px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              borderColor: "var(--color-accent-border)",
              background: "var(--color-accent-wash)",
              color: "var(--color-accent)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Acesso por mais {aula.restam} {aula.restam === 1 ? "dia" : "dias"}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {aula.video ? (
            <PlayerAula
              aulaId={aula.id}
              vimeoId={aula.video.vimeoId}
              vimeoHash={aula.video.vimeoHash}
              titulo={aula.titulo}
              posicaoInicial={aula.meuProgresso?.posicaoSegundos ?? 0}
              jaConcluida={concluida}
            />
          ) : (
            <div
              className="flex aspect-video items-center justify-center rounded-[4px] border border-line"
              style={{ background: "repeating-linear-gradient(135deg, #1E1913 0 8px, #16130F 8px 16px)" }}
            >
              <p className="text-[13px] text-ink-faint">Vídeo ainda não vinculado a esta aula.</p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <DuvidaDaAulaForm aulaId={aula.id} jaEnviou={!!duvidaAnterior} respondida={!!respostaDoVictor} />

            <form action={marcarConcluida.bind(null, aula.id, !concluida)} className="sm:order-2">
              <button
                type="submit"
                className="w-full rounded-[2px] border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] sm:w-auto"
                style={{
                  borderColor: concluida ? "var(--color-accent-border)" : "var(--color-line)",
                  color: concluida ? "var(--color-accent)" : "var(--color-ink)",
                }}
              >
                {concluida ? "✓ Concluída" : "Marcar como concluída"}
              </button>
            </form>

            {aula.materialUrl && (
              <a
                href={aula.materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[2px] border border-line px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent-border sm:order-3"
              >
                Material da aula
              </a>
            )}
          </div>

          {aula.descricao && (
            <section className="mt-6 rounded-[4px] border border-line bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Nesta aula</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{aula.descricao}</p>
            </section>
          )}
        </div>

        {/* Lista de aulas do modulo */}
        <aside>
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Aulas</p>
            <p className="font-mono text-[11px] text-ink-faint">
              {indice + 1} / {modulo.aulas.length}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-1">
            {modulo.aulas.map((a, i) => {
              const atual = a.id === id;
              const feita = a.meuProgresso?.concluida ?? false;
              return (
                <Link
                  key={a.id}
                  href={`/painel/aula/${a.id}`}
                  className="flex items-start gap-3 rounded-[2px] px-3 py-2.5"
                  style={{
                    background: atual ? "var(--color-accent-wash)" : "transparent",
                    borderLeft: atual ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px]"
                    style={{
                      borderColor: feita || atual ? "var(--color-accent)" : "var(--color-line)",
                      background: atual ? "var(--color-accent)" : "transparent",
                      color: atual ? "var(--color-accent-ink)" : "var(--color-accent)",
                    }}
                  >
                    {feita ? "✓" : atual ? "▶" : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[13.5px] leading-snug"
                      style={{ color: atual ? "var(--color-ink)" : "var(--color-ink-soft)" }}
                    >
                      {a.titulo}
                    </span>
                    {a.restam !== null && a.restam <= 7 && (
                      <span className="mt-0.5 block font-mono text-[11px] text-accent">
                        expira em {a.restam}d
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          {proxima && (
            <Link
              href={`/painel/aula/${proxima.id}`}
              className="mt-4 block rounded-[2px] bg-accent py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
            >
              Próxima aula
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
