import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hojeData } from "@/lib/data";

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

// Dashboard "Hoje" do aluno (handoff, tela 1b). Ordem dos blocos e
// intencional (mentalidade primeiro, depois treino, metas, nutricao,
// recado) — repete a mesma ordem do design.
export async function DashboardAluno({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const hoje = hojeData();

  const [
    mensagem,
    assinatura,
    treinos,
    habitoAgua,
    habitoSono,
    planoNutricional,
    recado,
    avatarUrl,
    anamnese,
    alertasNaoLidos,
  ] = await Promise.all([
      prisma.mensagemMentalidade.findFirst({
        where: { ativo: true, publicadoEm: { lte: new Date() } },
        orderBy: { publicadoEm: "desc" },
      }),
      prisma.assinatura.findFirst({
        where: { usuarioId, status: "ATIVA" },
        include: { plano: true },
      }),
      prisma.treino.findMany({
        where: { usuarioId, ativo: true },
        include: { exercicios: { include: { exercicio: true } } },
        orderBy: { criadoEm: "asc" },
      }),
      prisma.habito.findUnique({
        where: { usuarioId_tipo: { usuarioId, tipo: "AGUA" } },
        include: { registros: { where: { data: hoje } } },
      }),
      prisma.habito.findUnique({
        where: { usuarioId_tipo: { usuarioId, tipo: "SONO" } },
        include: { registros: { where: { data: hoje } } },
      }),
      prisma.planoNutricional.findUnique({
        where: { usuarioId },
        include: { refeicoes: { include: { checkins: { where: { data: hoje } } }, orderBy: { ordem: "asc" } } },
      }),
      prisma.mensagem.findFirst({
        where: { usuarioId, autorId: { not: usuarioId } },
        orderBy: { criadoEm: "desc" },
      }),
      prisma.usuario.findUnique({ where: { id: usuarioId }, select: { avatarUrl: true } }),
      prisma.anamnese.findUnique({ where: { usuarioId }, select: { id: true } }),
      prisma.alerta.count({ where: { usuarioId, lido: false } }),
    ]);

  // "Treino de hoje" = o primeiro treino ativo que a pessoa ainda nao fez
  // hoje (sem execucao registrada na data de hoje). Heuristica simples e
  // segura pra nao inventar um sistema de escala/dia-da-semana que ninguem
  // pediu — se so tiver 1 ficha ativa, e sempre ela.
  const idsExecutadosHoje = new Set(
    (
      await prisma.execucaoExercicio.findMany({
        where: { usuarioId, data: hoje },
        select: { exercicioId: true },
      })
    ).map((e) => e.exercicioId),
  );
  const treinoHoje =
    treinos.find((t) => t.exercicios.some((p) => !idsExecutadosHoje.has(p.exercicioId))) ?? treinos[0];

  const aguaHoje = habitoAgua?.registros[0]?.valor ?? 0;
  const aguaMeta = habitoAgua?.metaValor ?? 0;
  const sonoHoje = habitoSono?.registros[0]?.valor ?? 0;
  const sonoMeta = habitoSono?.metaValor ?? 0;

  const refeicoesTotal = planoNutricional?.refeicoes.length ?? 0;
  const refeicoesFeitas = planoNutricional?.refeicoes.filter((r) => r.checkins.length > 0).length ?? 0;

  const diaSemana = DIAS_SEMANA[new Date().getDay()];

  return (
    <main className="px-6 pt-13 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{diaSemana}</p>
          <h1 className="font-display mt-1 text-[30px] leading-tight text-ink">Bom dia, {nome.split(" ")[0]}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/painel/alertas" className="relative" aria-label="Alertas">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-soft">
              <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
            </svg>
            {alertasNaoLidos > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-accent-ink"
                style={{ background: "var(--color-warn)" }}
              >
                {alertasNaoLidos}
              </span>
            )}
          </Link>
          <Link href="/painel/dados">
            {avatarUrl?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full border border-accent object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent text-sm text-accent">
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>

      {!anamnese && (
        <Link
          href="/painel/anamnese"
          className="mt-6 flex items-center justify-between rounded-[4px] border border-accent-border bg-accent-wash px-4 py-3"
        >
          <span className="text-[13px] text-ink">Responda 4 perguntas rápidas pra gente montar sua ficha.</span>
          <span className="text-accent">→</span>
        </Link>
      )}

      {mensagem && (
        <section
          className="mt-6 rounded-[4px] border border-accent-border p-5"
          style={{ background: "linear-gradient(160deg, rgba(201,168,124,0.10), rgba(201,168,124,0.02))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentalidade de hoje</p>
          <p className="font-display mt-2 text-[21px] italic leading-[1.45] text-ink">{mensagem.texto}</p>
          <p className="mt-3 text-[12px] text-ink-faint">Victor · 2 min de leitura</p>
        </section>
      )}

      {assinatura && treinoHoje ? (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Treino de hoje</p>
            {assinatura.plano.frequenciaSemanal && (
              <p className="whitespace-nowrap text-[12px] text-ink-soft">
                Plano {assinatura.plano.frequenciaSemanal}x/semana
              </p>
            )}
          </div>
          <h2 className="mt-1 text-[22px] font-semibold text-ink">{treinoHoje.nome}</h2>
          <p className="mt-1 text-[13px] text-ink-soft">{treinoHoje.exercicios.length} exercícios</p>
          <Link
            href={`/painel/treinos/${treinoHoje.id}`}
            className="mt-4 block rounded-[2px] bg-accent py-3 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-ink hover:bg-accent-hover"
          >
            Iniciar treino
          </Link>
        </section>
      ) : assinatura ? (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[13px] text-ink-soft">Você ainda não tem nenhuma ficha de treino.</p>
        </section>
      ) : (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[13px] text-ink-soft">Você ainda não escolheu um plano.</p>
          <Link href="/painel/planos" className="mt-2 inline-block text-[13px] font-medium text-accent">
            Ver planos disponíveis
          </Link>
        </section>
      )}

      {assinatura && (
        <div className="mt-4 flex gap-4 px-1">
          <Link href="/painel/agenda" className="text-[12px] font-medium text-accent">
            Ver agenda
          </Link>
          <Link href="/painel/videos" className="text-[12px] font-medium text-accent">
            Ver vídeos
          </Link>
        </div>
      )}

      {(habitoAgua || habitoSono) && (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Metas do dia</p>
          <div className="mt-4 flex flex-col gap-4">
            {habitoAgua && (
              <BarraMeta
                titulo="Água"
                valorTexto={`${aguaHoje} / ${aguaMeta} L`}
                percentual={aguaMeta > 0 ? Math.min(100, (aguaHoje / aguaMeta) * 100) : 0}
              />
            )}
            {habitoSono && (
              <BarraMeta
                titulo="Sono"
                valorTexto={`${sonoHoje}h / ${sonoMeta}h`}
                percentual={sonoMeta > 0 ? Math.min(100, (sonoHoje / sonoMeta) * 100) : 0}
              />
            )}
          </div>
          <Link href="/painel/habitos" className="mt-4 inline-block text-[12px] font-medium text-accent">
            Registrar
          </Link>
        </section>
      )}

      {planoNutricional && refeicoesTotal > 0 && (
        <section className="mt-5 rounded-[4px] border border-line bg-card p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Nutrição · check-in</p>
            <p className="text-[13px] text-ink-soft">
              {refeicoesFeitas} de {refeicoesTotal} refeições
            </p>
          </div>
          <Link href="/painel/nutricao" className="mt-3 block text-[12px] font-medium text-accent">
            Fazer check-in
          </Link>
        </section>
      )}

      {recado && (
        <Link
          href="/painel/mensagens"
          className="mt-5 flex items-center gap-3 rounded-[4px] border border-line bg-card p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent text-xs text-accent">
            V
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">Victor comentou seu treino</p>
            <p className="truncate text-[12px] text-ink-soft">{recado.texto}</p>
          </div>
        </Link>
      )}
    </main>
  );
}

function BarraMeta({
  titulo,
  valorTexto,
  percentual,
}: {
  titulo: string;
  valorTexto: string;
  percentual: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[14px] text-ink">{titulo}</p>
        <p className="text-[13px] text-ink-soft">{valorTexto}</p>
      </div>
      <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: "rgba(237,233,227,0.12)" }}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}
