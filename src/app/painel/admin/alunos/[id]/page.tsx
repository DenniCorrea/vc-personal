import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { paraInputDate, formatarDataCurta } from "@/lib/data";
import { registrarAvaliacao } from "../actions";

const ROTULO_OBJETIVO: Record<string, string> = {
  HIPERTROFIA: "Hipertrofia",
  EMAGRECIMENTO: "Emagrecimento",
  SAUDE_CONSTANCIA: "Saúde e constância",
  PERFORMANCE: "Performance",
};

export default async function PaginaAdminAlunoDetalhe({ params }: PageProps<"/painel/admin/alunos/[id]">) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const aluno = await prisma.usuario.findFirst({
    where: { id, role: "ALUNO" },
    include: {
      assinaturas: { where: { status: "ATIVA" }, include: { plano: true }, take: 1 },
      anamnese: true,
    },
  });
  if (!aluno) notFound();

  const [execucoesSemana, checkinsSemana, checkinsTotalSemana, habitoSono, planoNutricional, avaliacoes] =
    await Promise.all([
      prisma.execucaoExercicio.findMany({
        where: { usuarioId: id, data: { gte: seteDiasAtras } },
        select: { data: true, carga: true },
      }),
      prisma.checkinNutricional.count({
        where: { status: "SEGUIU", criadoEm: { gte: seteDiasAtras }, refeicao: { planoNutricional: { usuarioId: id } } },
      }),
      prisma.checkinNutricional.count({
        where: { criadoEm: { gte: seteDiasAtras }, refeicao: { planoNutricional: { usuarioId: id } } },
      }),
      prisma.habito.findUnique({
        where: { usuarioId_tipo: { usuarioId: id, tipo: "SONO" } },
        include: { registros: { where: { data: { gte: seteDiasAtras } } } },
      }),
      prisma.planoNutricional.findFirst({ where: { usuarioId: id } }),
      prisma.avaliacao.findMany({ where: { usuarioId: id }, orderBy: { data: "asc" } }),
    ]);

  const diasComTreino = new Set(execucoesSemana.map((e) => e.data.toISOString().slice(0, 10))).size;
  const nutricaoPct = checkinsTotalSemana > 0 ? Math.round((checkinsSemana / checkinsTotalSemana) * 100) : null;
  const sonoMedia =
    habitoSono && habitoSono.registros.length > 0
      ? Math.round((habitoSono.registros.reduce((s, r) => s + r.valor, 0) / habitoSono.registros.length) * 10) / 10
      : null;

  const cargasComData = execucoesSemana.filter((e) => e.carga != null);

  return (
    <main>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-[18px] text-ink-soft">
            {aluno.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-[30px] text-ink">{aluno.nome}</h1>
            <p className="text-[13px] text-ink-soft">
              {aluno.assinaturas[0]?.plano.nome ?? "Sem plano ativo"}
              {aluno.anamnese?.objetivo && ` · ${ROTULO_OBJETIVO[aluno.anamnese.objetivo]}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            href={`/painel/admin/conversas/${aluno.id}`}
            className="rounded-[2px] border border-line px-4 py-2.5 text-[12px] font-medium text-ink"
          >
            Mensagem
          </Link>
          <Link
            href={`/painel/admin/treinos/aluno/${aluno.id}`}
            className="rounded-[2px] bg-accent px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink"
          >
            Ficha de treino
          </Link>
        </div>
      </div>

      <div className="mt-8 flex gap-3 border-b border-line text-[13px]">
        <span className="border-b-2 border-accent px-1 pb-3 text-ink">Visão geral</span>
        <Link href={`/painel/admin/treinos/aluno/${aluno.id}`} className="px-1 pb-3 text-ink-soft hover:text-ink">
          Ficha de treino
        </Link>
        <Link href={`/painel/admin/nutricao/${aluno.id}`} className="px-1 pb-3 text-ink-soft hover:text-ink">
          Nutrição
        </Link>
        <Link href={`/painel/admin/checkins?aluno=${aluno.id}`} className="px-1 pb-3 text-ink-soft hover:text-ink">
          Check-ins
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_300px] gap-6">
        <div className="flex flex-col gap-5">
          {avaliacoes.length >= 2 ? (
            <RelatorioComparativo avaliacoes={avaliacoes} />
          ) : (
            <div className="rounded-[4px] border border-line bg-card-admin p-5">
              <p className="text-[13px] text-ink-soft">
                {avaliacoes.length === 0
                  ? "Nenhuma avaliação registrada ainda."
                  : "Registre uma segunda avaliação pra gerar o comparativo de evolução."}
              </p>
            </div>
          )}

          <NovaAvaliacaoForm usuarioId={aluno.id} />

          {planoNutricional ? (
            <div className="rounded-[4px] border border-line bg-card-admin p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                Nutrição — últimos 7 dias
              </p>
              <p className="mt-2 text-[24px] font-semibold text-ink">
                {nutricaoPct !== null ? `${nutricaoPct}%` : "—"}
              </p>
              <p className="text-[12px] text-ink-soft">de aderência aos check-ins</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {aluno.anamnese?.lesoesRestricoes && (
            <div
              className="rounded-[4px] border p-4"
              style={{ borderColor: "var(--color-warn)", background: "rgba(192,72,59,0.07)" }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-warn)" }}
              >
                Atenção
              </p>
              <p className="mt-1.5 text-[13px]" style={{ color: "var(--color-warn)" }}>
                {aluno.anamnese.lesoesRestricoes}
              </p>
            </div>
          )}

          <div className="rounded-[4px] border border-line bg-card-admin p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Últimos 7 dias</p>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <LinhaStat rotulo="Treinos" valor={`${diasComTreino}`} />
              <LinhaStat rotulo="Nutrição" valor={nutricaoPct !== null ? `${nutricaoPct}%` : "—"} />
              <LinhaStat rotulo="Sono médio" valor={sonoMedia !== null ? `${sonoMedia}h` : "—"} />
              <LinhaStat rotulo="Séries com carga" valor={`${cargasComData.length}`} />
            </div>
          </div>

          {aluno.anamnese && (
            <div className="rounded-[4px] border border-line bg-card-admin p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Anamnese</p>
              <p className="mt-2 text-[13px] text-ink-soft">
                {aluno.anamnese.diasDisponiveis}x/semana disponíveis
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function NovaAvaliacaoForm({ usuarioId }: { usuarioId: string }) {
  const registrar = registrarAvaliacao.bind(null, usuarioId);
  return (
    <details className="rounded-[4px] border border-line bg-card-admin p-5">
      <summary className="cursor-pointer text-[13px] font-medium text-accent">+ Registrar nova avaliação</summary>
      <form action={registrar} className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
        <label className="flex flex-col gap-1 text-ink-soft">
          Data
          <input
            name="data"
            type="date"
            required
            defaultValue={paraInputDate(new Date())}
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          Peso (kg)
          <input
            name="peso"
            type="number"
            step="0.1"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          Altura (cm)
          <input
            name="altura"
            type="number"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          % gordura
          <input
            name="percentualGordura"
            type="number"
            step="0.1"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          Cintura (cm)
          <input
            name="cintura"
            type="number"
            step="0.1"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          Braço direito (cm)
          <input
            name="bracoDireito"
            type="number"
            step="0.1"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-soft">
          Coxa (cm)
          <input
            name="coxa"
            type="number"
            step="0.1"
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-ink-soft">
          Observações nutricionais
          <textarea
            name="observacoesNutricionais"
            rows={2}
            className="rounded-[2px] border border-line px-2 py-1.5 text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>
        <button
          type="submit"
          className="col-span-3 self-start rounded-[2px] bg-accent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink"
        >
          Salvar avaliação
        </button>
      </form>
    </details>
  );
}

function LinhaStat({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-ink-soft">{rotulo}</span>
      <span className="font-medium text-ink">{valor}</span>
    </div>
  );
}

function RelatorioComparativo({
  avaliacoes,
}: {
  avaliacoes: { data: Date; peso: number | null; percentualGordura: number | null; medidas: unknown }[];
}) {
  const primeira = avaliacoes[0];
  const ultima = avaliacoes[avaliacoes.length - 1];
  const medidasPrimeira = (primeira.medidas as Record<string, number> | null) ?? {};
  const medidasUltima = (ultima.medidas as Record<string, number> | null) ?? {};
  const chaves = [...new Set([...Object.keys(medidasPrimeira), ...Object.keys(medidasUltima)])];

  return (
    <div className="rounded-[4px] border border-line bg-card-admin p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
        Comparativo · {formatarDataCurta(primeira.data, true)} → {formatarDataCurta(ultima.data, true)}
      </p>
      <div className="mt-4 flex flex-col gap-2 text-[14px]">
        {primeira.peso != null && ultima.peso != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-ink">Peso</span>
            <span className="text-ink-soft">
              {primeira.peso} → {ultima.peso} kg
              <span className="ml-2 text-accent">
                {ultima.peso - primeira.peso > 0 ? "+" : ""}
                {Math.round((ultima.peso - primeira.peso) * 10) / 10}
              </span>
            </span>
          </div>
        )}
        {primeira.percentualGordura != null && ultima.percentualGordura != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-ink">% gordura</span>
            <span className="text-ink-soft">
              {primeira.percentualGordura}% → {ultima.percentualGordura}%
            </span>
          </div>
        )}
        {chaves.map((chave) => (
          <div key={chave} className="flex items-baseline justify-between">
            <span className="capitalize text-ink">{chave}</span>
            <span className="text-ink-soft">
              {medidasPrimeira[chave] ?? "—"} → {medidasUltima[chave] ?? "—"} cm
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-ink-faint">
        A interpretação é sua — esses números são só o ponto de partida da conversa.
      </p>
    </div>
  );
}
