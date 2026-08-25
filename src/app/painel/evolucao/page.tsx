import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarFotoProgresso } from "./actions";

export default async function PaginaEvolucao() {
  const session = await exigirPapel("ALUNO");

  const [avaliacoes, execucoes, fotos] = await Promise.all([
    prisma.avaliacao.findMany({ where: { usuarioId: session.user.id }, orderBy: { data: "asc" } }),
    prisma.execucaoExercicio.findMany({
      where: { usuarioId: session.user.id },
      include: { exercicio: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.fotoProgresso.findMany({ where: { usuarioId: session.user.id }, orderBy: { criadoEm: "desc" }, take: 6 }),
  ]);

  // Progressao de carga: por exercicio, maior carga da primeira data
  // registrada vs. da ultima data registrada.
  const porExercicio = new Map<string, { nome: string; datas: Map<string, number> }>();
  for (const execucao of execucoes) {
    if (execucao.carga == null) continue;
    const chave = execucao.exercicioId;
    const dataIso = execucao.data.toISOString().slice(0, 10);
    if (!porExercicio.has(chave)) porExercicio.set(chave, { nome: execucao.exercicio.nome, datas: new Map() });
    const entrada = porExercicio.get(chave)!;
    entrada.datas.set(dataIso, Math.max(entrada.datas.get(dataIso) ?? 0, execucao.carga));
  }
  const progressoCarga = [...porExercicio.values()]
    .map((e) => {
      const datasOrdenadas = [...e.datas.entries()].sort(([a], [b]) => a.localeCompare(b));
      if (datasOrdenadas.length < 1) return null;
      const primeira = datasOrdenadas[0][1];
      const ultima = datasOrdenadas[datasOrdenadas.length - 1][1];
      return { nome: e.nome, primeira, ultima, evoluiu: ultima > primeira };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .slice(0, 6);

  const primeiraAvaliacao = avaliacoes[0];
  const ultimaAvaliacao = avaliacoes[avaliacoes.length - 1];
  const deltaPeso =
    primeiraAvaliacao?.peso != null && ultimaAvaliacao?.peso != null
      ? Math.round((ultimaAvaliacao.peso - primeiraAvaliacao.peso) * 10) / 10
      : null;

  const diasComExecucao = new Set(execucoes.map((e) => e.data.toISOString().slice(0, 10))).size;

  const medidasIniciais = (primeiraAvaliacao?.medidas as Record<string, number> | null) ?? {};
  const medidasAtuais = (ultimaAvaliacao?.medidas as Record<string, number> | null) ?? {};
  const chavesMedidas = [...new Set([...Object.keys(medidasIniciais), ...Object.keys(medidasAtuais)])];

  return (
    <main className="px-6 pt-cabecalho-aluno pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Sua evolução</p>
      <h1 className="font-display mt-1 text-[28px] text-ink">Progresso</h1>

      {progressoCarga.length > 0 && (
        <section className="mt-6 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Progressão de carga</p>
          <div className="mt-4 flex flex-col gap-3">
            {progressoCarga.map((item) => (
              <div key={item.nome}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[14px] text-ink">{item.nome}</p>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: item.evoluiu ? "var(--color-accent)" : "var(--color-ink-soft)" }}
                  >
                    {item.primeira} → {item.ultima} kg
                  </p>
                </div>
                <div className="mt-1.5 h-[3px] w-full rounded-full" style={{ background: "rgba(237,233,227,0.12)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: item.ultima > 0 ? `${Math.min(100, (item.ultima / (item.ultima * 1.2)) * 100)}%` : "0%",
                      background: item.evoluiu ? "var(--color-accent)" : "rgba(237,233,227,0.35)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {ultimaAvaliacao?.peso != null && (
          <div className="rounded-[4px] border border-line bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Peso</p>
            <p className="mt-1 text-[24px] font-semibold text-ink">{ultimaAvaliacao.peso} kg</p>
            {deltaPeso != null && (
              <p className="mt-0.5 text-[12px] text-ink-soft">
                {deltaPeso > 0 ? "+" : ""}
                {deltaPeso} kg no período
              </p>
            )}
          </div>
        )}
        <div className="rounded-[4px] border border-line bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Treinos feitos</p>
          <p className="mt-1 text-[24px] font-semibold text-ink">{diasComExecucao}</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">dias registrados no período</p>
        </div>
      </div>

      {chavesMedidas.length > 0 && (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Medidas</p>
          <div className="mt-3 flex flex-col gap-2">
            {chavesMedidas.map((chave) => {
              const inicial = medidasIniciais[chave];
              const atual = medidasAtuais[chave];
              const delta = inicial != null && atual != null ? Math.round((atual - inicial) * 10) / 10 : null;
              return (
                <div key={chave} className="flex items-baseline justify-between text-[14px]">
                  <span className="capitalize text-ink">{chave}</span>
                  <span className="text-ink-soft">
                    {atual ?? inicial} cm
                    {delta != null && delta !== 0 && (
                      <span className="ml-2 text-accent">
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
            Fotos de acompanhamento
          </p>
        </div>

        <form action={enviarFotoProgresso} className="mt-3 flex flex-col gap-2">
          <input
            type="file"
            name="foto"
            accept="image/*"
            required
            className="text-[12px] text-ink-soft file:mr-3 file:rounded-[2px] file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:uppercase file:text-accent-ink"
          />
          <input
            type="text"
            name="legenda"
            placeholder="ex: semana 6 · frente"
            className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
          <button
            type="submit"
            className="self-start rounded-[2px] border border-accent-border px-4 py-2 text-[12px] font-medium text-accent"
          >
            Enviar foto
          </button>
        </form>

        {fotos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {fotos.map((foto) => (
              <div key={foto.id} className="overflow-hidden rounded-[2px] border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt={foto.legenda ?? ""} className="h-[150px] w-full object-cover" />
                {foto.legenda && (
                  <p className="px-2 py-1.5 font-mono text-[11px] text-ink-faint">{foto.legenda}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
