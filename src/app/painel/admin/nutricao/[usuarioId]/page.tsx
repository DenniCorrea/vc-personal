import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { adicionarRefeicao, removerRefeicao, definirMetasNutricionais } from "../actions";

const seteDiasAtras = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

export default async function PaginaAdminNutricaoAluno({
  params,
}: PageProps<"/painel/admin/nutricao/[usuarioId]">) {
  await exigirPapel("ADMIN");
  const { usuarioId } = await params;

  const aluno = await prisma.usuario.findFirst({ where: { id: usuarioId, role: "ALUNO" } });
  if (!aluno) notFound();

  const [plano, habitoAgua, habitoSono, adaptacoesRecentes] = await Promise.all([
    prisma.planoNutricional.findUnique({
      where: { usuarioId },
      include: {
        refeicoes: {
          include: { checkins: { where: { criadoEm: { gte: seteDiasAtras() } } } },
          orderBy: { ordem: "asc" },
        },
      },
    }),
    prisma.habito.findUnique({ where: { usuarioId_tipo: { usuarioId, tipo: "AGUA" } } }),
    prisma.habito.findUnique({ where: { usuarioId_tipo: { usuarioId, tipo: "SONO" } } }),
    prisma.checkinNutricional.findMany({
      where: {
        status: "ADAPTOU",
        criadoEm: { gte: seteDiasAtras() },
        refeicao: { planoNutricional: { usuarioId } },
      },
      include: { refeicao: true },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
  ]);

  const adicionar = adicionarRefeicao.bind(null, usuarioId);
  const definirMetas = definirMetasNutricionais.bind(null, usuarioId);

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{aluno.nome.toUpperCase()}</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Plano alimentar</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[4px] border border-line">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-4 py-3">Refeição</th>
                <th className="px-4 py-3">Composição</th>
                <th className="px-4 py-3">Kcal</th>
                <th className="px-4 py-3">Aderência</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {plano?.refeicoes.map((refeicao) => {
                const total = refeicao.checkins.length;
                const seguiu = refeicao.checkins.filter((c) => c.status === "SEGUIU").length;
                const pct = total > 0 ? Math.round((seguiu / total) * 100) : null;
                return (
                  <tr key={refeicao.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3.5 text-[14px] text-ink">
                      {refeicao.nome}
                      {refeicao.horario && <span className="ml-2 text-[12px] text-ink-faint">{refeicao.horario}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-soft">{refeicao.composicao}</td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-soft">{refeicao.kcal ?? "—"}</td>
                    <td
                      className="px-4 py-3.5 text-[13px]"
                      style={{
                        color:
                          pct === null
                            ? "var(--color-ink-faint)"
                            : pct >= 80
                              ? "var(--color-accent)"
                              : pct >= 50
                                ? "var(--color-ink-soft)"
                                : "var(--color-warn)",
                      }}
                    >
                      {pct !== null ? `${pct}%` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <form action={removerRefeicao.bind(null, usuarioId, refeicao.id)}>
                        <button type="submit" className="text-[12px] text-ink-faint hover:text-warn">
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {(!plano || plano.refeicoes.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[13px] text-ink-soft">
                    Nenhuma refeição cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form action={adicionar} className="flex flex-col gap-2 border-t border-line p-4">
            <div className="grid grid-cols-3 gap-2">
              <input
                name="nome"
                placeholder="Refeição (ex: Almoço)"
                required
                className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                style={{ background: "var(--color-input)" }}
              />
              <input
                name="horario"
                placeholder="Horário (ex: 12:30)"
                className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                style={{ background: "var(--color-input)" }}
              />
              <input
                name="kcal"
                type="number"
                placeholder="Kcal"
                className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                style={{ background: "var(--color-input)" }}
              />
            </div>
            <input
              name="composicao"
              placeholder="Composição (ex: 150g frango · 5 col. arroz · salada)"
              required
              className="rounded-[2px] border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
            <button
              type="submit"
              className="self-start rounded-[2px] border border-accent-border px-4 py-2 text-[12px] font-medium text-accent"
            >
              + Adicionar refeição
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {adaptacoesRecentes.length > 0 && (
            <div className="rounded-[4px] border border-line bg-card-admin p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                Adaptações a revisar
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {adaptacoesRecentes.map((c) => (
                  <div key={c.id}>
                    <p className="text-[13px] text-ink">&ldquo;{c.observacaoAdaptacao}&rdquo;</p>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {c.refeicao.nome} · {c.criadoEm.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[4px] border border-line bg-card-admin p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Metas diárias</p>
            <form action={definirMetas} className="mt-3 flex flex-col gap-3 text-[13px]">
              <label className="flex items-center justify-between gap-2">
                <span className="text-ink">Água (L)</span>
                <input
                  name="metaAguaLitros"
                  type="number"
                  step="0.5"
                  defaultValue={habitoAgua?.metaValor}
                  className="w-20 rounded-[2px] border border-line px-2 py-1.5 text-right text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-ink">Sono (h)</span>
                <input
                  name="metaSonoHoras"
                  type="number"
                  step="0.5"
                  defaultValue={habitoSono?.metaValor}
                  className="w-20 rounded-[2px] border border-line px-2 py-1.5 text-right text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-ink">Proteína (g)</span>
                <input
                  name="metaProteinaG"
                  type="number"
                  defaultValue={plano?.metaProteinaG ?? undefined}
                  className="w-20 rounded-[2px] border border-line px-2 py-1.5 text-right text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
              </label>
              <button
                type="submit"
                className="mt-1 self-start rounded-[2px] bg-accent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink"
              >
                Salvar metas
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
