import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData, formatarDataCurta } from "@/lib/data";
import { VimeoPlayer } from "@/components/VimeoPlayer";
import { registrarSerie } from "../actions";

export default async function PaginaExecucaoTreino({ params }: PageProps<"/painel/treinos/[id]">) {
  const { id } = await params;
  const session = await exigirPapel("ALUNO");
  const hoje = hojeData();

  // Ownership: so retorna se o treino for do proprio usuario logado — mesmo
  // que alguem adivinhe o id de uma ficha de outro aluno, essa query nao
  // devolve nada.
  const treino = await prisma.treino.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      exercicios: {
        include: { exercicio: { include: { video: true } } },
        orderBy: { ordem: "asc" },
      },
    },
  });
  if (!treino) notFound();

  // Pra cada exercicio: a ULTIMA data (antes de hoje) em que teve execucao
  // registrada, e as series de hoje (se ja tiver comecado a registrar).
  const exerciciosComHistorico = await Promise.all(
    treino.exercicios.map(async (prescricao) => {
      const ultimaExecucao = await prisma.execucaoExercicio.findFirst({
        where: { usuarioId: session.user.id, exercicioId: prescricao.exercicioId, data: { lt: hoje } },
        orderBy: { data: "desc" },
        select: { data: true },
      });

      const [seriesAnteriores, seriesHoje] = await Promise.all([
        ultimaExecucao
          ? prisma.execucaoExercicio.findMany({
              where: {
                usuarioId: session.user.id,
                exercicioId: prescricao.exercicioId,
                data: ultimaExecucao.data,
              },
              orderBy: { numeroSerie: "asc" },
            })
          : Promise.resolve([]),
        prisma.execucaoExercicio.findMany({
          where: { usuarioId: session.user.id, exercicioId: prescricao.exercicioId, data: hoje },
          orderBy: { numeroSerie: "asc" },
        }),
      ]);

      return { prescricao, seriesAnteriores, seriesHoje, dataUltimaExecucao: ultimaExecucao?.data ?? null };
    }),
  );

  return (
    <main className="px-6 pt-13 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/painel/treinos" className="text-ink-soft hover:text-ink" aria-label="Voltar">
          ←
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          {treino.nome.toUpperCase()}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-10">
        {exerciciosComHistorico.map(({ prescricao, seriesAnteriores, seriesHoje, dataUltimaExecucao }, indice) => (
          <section key={prescricao.id}>
            <p className="text-[12px] text-ink-subtle">
              Exercício {indice + 1} de {treino.exercicios.length}
            </p>
            <h2 className="font-display mt-1 text-[26px] leading-tight text-ink">{prescricao.exercicio.nome}</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              {[
                prescricao.series && `${prescricao.series} séries`,
                prescricao.repeticoes && `${prescricao.repeticoes} reps`,
                prescricao.descanso && `descanso ${prescricao.descanso}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {prescricao.exercicio.video && (
              <div className="mt-4">
                <VimeoPlayer
                  vimeoId={prescricao.exercicio.video.vimeoId}
                  vimeoHash={prescricao.exercicio.video.vimeoHash}
                  titulo={prescricao.exercicio.nome}
                />
              </div>
            )}

            {(prescricao.exercicio.grupoMuscularPrincipal || prescricao.exercicio.cuidados) && (
              <div className="mt-4 flex gap-4 rounded-[4px] border border-line bg-card p-4">
                {prescricao.exercicio.imagemAnatomica && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prescricao.exercicio.imagemAnatomica}
                    alt=""
                    className="h-[118px] w-[80px] shrink-0 rounded-[2px] object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Músculos</p>
                  {prescricao.exercicio.grupoMuscularPrincipal && (
                    <p className="mt-1 text-[13px]" style={{ color: "var(--color-warn)" }}>
                      {prescricao.exercicio.grupoMuscularPrincipal} <span className="text-ink-faint">(principal)</span>
                    </p>
                  )}
                  {prescricao.exercicio.gruposMuscularesSecundarios.length > 0 && (
                    <p className="text-[13px] text-ink-soft">
                      {prescricao.exercicio.gruposMuscularesSecundarios.join(", ")}
                    </p>
                  )}
                  {prescricao.exercicio.cuidados && (
                    <p className="mt-2 text-[12px] text-ink-soft">{prescricao.exercicio.cuidados}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-[4px] border border-accent-border p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Registrar hoje</p>
                {dataUltimaExecucao && (
                  <p className="text-[12px] text-ink-faint">
                    Último: {formatarDataCurta(dataUltimaExecucao)}
                  </p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-[36px_1fr_1fr_64px] items-center gap-x-2 gap-y-2 text-[11px] uppercase tracking-wide text-ink-subtle">
                <span>Sér</span>
                <span>Carga (kg)</span>
                <span>Reps</span>
                <span>Antes</span>

                {Array.from({ length: Math.max(prescricao.series ?? 1, seriesAnteriores.length, seriesHoje.length, 1) }).map(
                  (_, i) => {
                    const numeroSerie = i + 1;
                    const registroHoje = seriesHoje.find((s) => s.numeroSerie === numeroSerie);
                    const registroAntes = seriesAnteriores.find((s) => s.numeroSerie === numeroSerie);
                    return (
                      <form
                        key={numeroSerie}
                        action={registrarSerie.bind(null, treino.id)}
                        className="contents"
                      >
                        <input type="hidden" name="exercicioId" value={prescricao.exercicioId} />
                        <input type="hidden" name="numeroSerie" value={numeroSerie} />
                        <span className="text-[15px] text-ink">{numeroSerie}</span>
                        <input
                          name="carga"
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          defaultValue={registroHoje?.carga ?? undefined}
                          className="rounded-[2px] border px-3 py-2.5 text-[17px] font-semibold text-ink outline-none"
                          style={{ background: "var(--color-input)", borderColor: "rgba(237,233,227,0.14)" }}
                        />
                        <input
                          name="repeticoes"
                          type="number"
                          inputMode="numeric"
                          defaultValue={registroHoje?.repeticoes ?? undefined}
                          className="rounded-[2px] border px-3 py-2.5 text-[17px] font-semibold text-ink outline-none"
                          style={{ background: "var(--color-input)", borderColor: "rgba(237,233,227,0.14)" }}
                        />
                        <span className="font-mono text-[12px] text-ink-faint">
                          {registroAntes ? `${registroAntes.carga ?? "—"}×${registroAntes.repeticoes ?? "—"}` : "—"}
                        </span>
                        <button
                          type="submit"
                          className="col-span-4 -mt-1 self-start text-[11px] font-medium text-accent"
                        >
                          Salvar série {numeroSerie}
                        </button>
                      </form>
                    );
                  },
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
