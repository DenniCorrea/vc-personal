import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData, formatador } from "@/lib/data";

const formatoHoje = formatador({ weekday: "long", day: "2-digit", month: "long" });

const SEIS_SEMANAS_MS = 6 * 7 * 24 * 60 * 60 * 1000;

export default async function PaginaAdminVisaoDoDia() {
  // O layout.tsx desta pasta ja chama exigirPapel("ADMIN"), mas layout e
  // page sao renderizados em PARALELO no App Router — as queries abaixo
  // comecariam a rodar antes do redirect do layout acontecer. Repetir a
  // checagem aqui e a mesma regra que todas as outras paginas /admin ja
  // seguem: quem protege e a propria pagina, nunca so a casca em volta.
  await exigirPapel("ADMIN");

  const hoje = hojeData();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const tresDiasAtras = new Date(hoje);
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

  const alunos = await prisma.usuario.findMany({
    where: { role: "ALUNO", ativo: true },
    include: {
      assinaturas: { where: { status: "ATIVA" }, include: { plano: true }, take: 1 },
      treinos: { where: { ativo: true }, orderBy: { atualizadoEm: "desc" }, take: 1 },
      execucoes: { where: { data: { gte: seteDiasAtras } }, select: { data: true } },
      mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });

  const dadosPorAluno = await Promise.all(
    alunos.map(async (aluno) => {
      const ultimaExecucao = await prisma.execucaoExercicio.findFirst({
        where: { usuarioId: aluno.id },
        orderBy: { data: "desc" },
        select: { data: true },
      });
      const checkinsAdaptouRecentes = await prisma.checkinNutricional.count({
        where: {
          status: "ADAPTOU",
          criadoEm: { gte: seteDiasAtras },
          refeicao: { planoNutricional: { usuarioId: aluno.id } },
        },
      });

      const assinatura = aluno.assinaturas[0];
      const treino = aluno.treinos[0];
      const ultimaMensagem = aluno.mensagens[0];

      const diasSemTreino = ultimaExecucao
        ? Math.floor((hoje.getTime() - ultimaExecucao.data.getTime()) / 86_400_000)
        : null;
      const semTreino = diasSemTreino === null || diasSemTreino >= 3;
      const revisaoRecomendada = treino ? hoje.getTime() - treino.atualizadoEm.getTime() > SEIS_SEMANAS_MS : false;
      const mensagemAguardando = ultimaMensagem && ultimaMensagem.autorId === aluno.id && !ultimaMensagem.lida;

      const diasComTreinoNaSemana = new Set(aluno.execucoes.map((e) => e.data.toISOString().slice(0, 10))).size;
      const aderencia =
        assinatura?.plano.frequenciaSemanal && assinatura.plano.frequenciaSemanal > 0
          ? Math.min(100, Math.round((diasComTreinoNaSemana / assinatura.plano.frequenciaSemanal) * 100))
          : null;

      let situacao: { texto: string; nivel: "risco" | "acao" | "rotina" } | null = null;
      if (semTreino) {
        situacao = {
          texto: diasSemTreino === null ? "Nunca treinou" : `Parou de treinar (${diasSemTreino}d)`,
          nivel: "risco",
        };
      } else if (mensagemAguardando) {
        situacao = { texto: "Mensagem aguardando resposta", nivel: "acao" };
      } else if (checkinsAdaptouRecentes > 0) {
        situacao = { texto: `Adaptou ${checkinsAdaptouRecentes} refeições`, nivel: "acao" };
      } else if (revisaoRecomendada) {
        situacao = { texto: "Revisão recomendada", nivel: "rotina" };
      }

      return {
        aluno,
        assinatura,
        situacao,
        ultimaExecucao: ultimaExecucao?.data ?? null,
        diasSemTreino,
        aderencia,
        semTreino,
        checkinsAdaptouRecentes,
        revisaoRecomendada,
        mensagemAguardando,
      };
    }),
  );

  const semTreinoCount = dadosPorAluno.filter((d) => d.semTreino).length;
  const checkinsAResponder = dadosPorAluno.reduce((soma, d) => soma + d.checkinsAdaptouRecentes, 0);
  const fichasRevisao = dadosPorAluno.filter((d) => d.revisaoRecomendada).length;
  const comAderencia = dadosPorAluno.filter((d) => d.aderencia !== null);
  const aderenciaMedia =
    comAderencia.length > 0
      ? Math.round(comAderencia.reduce((soma, d) => soma + (d.aderencia ?? 0), 0) / comAderencia.length)
      : null;

  const filaAtencao = dadosPorAluno
    .filter((d) => d.situacao !== null)
    .sort((a, b) => (a.situacao?.nivel === "risco" ? -1 : 1) - (b.situacao?.nivel === "risco" ? -1 : 1));

  return (
    <main>
      <p className="text-[12px] text-ink-soft">
        {formatoHoje.format(new Date())}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] text-ink lg:text-[34px]">Quem precisa da sua atenção hoje</h1>
        <Link
          href="/painel/admin/mensagens/novo"
          className="shrink-0 rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-hover"
        >
          Publicar mentalidade
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CartaoTriagem titulo="Sem treino há 3+ dias" valor={semTreinoCount} cor="var(--color-warn)" />
        <CartaoTriagem titulo="Check-ins a responder" valor={checkinsAResponder} />
        <CartaoTriagem titulo="Revisão recomendada" valor={fichasRevisao} />
        <CartaoTriagem
          titulo="Aderência média"
          valor={aderenciaMedia !== null ? `${aderenciaMedia}%` : "—"}
          cor="var(--color-accent)"
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-[4px] border border-line">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Último treino</th>
              <th className="px-4 py-3">Aderência</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filaAtencao.map(({ aluno, assinatura, situacao, diasSemTreino, aderencia, mensagemAguardando }) => (
              <tr key={aluno.id} className="border-b border-line last:border-0 hover:bg-accent-wash">
                <td className="px-4 py-3.5">
                  <p className="text-[15px] text-ink">{aluno.nome}</p>
                  <p className="text-[12px] text-ink-soft">{assinatura?.plano.nome ?? "Sem plano ativo"}</p>
                </td>
                <td className="px-4 py-3.5 text-[13px]">
                  <span
                    style={{
                      color:
                        situacao?.nivel === "risco"
                          ? "var(--color-warn)"
                          : situacao?.nivel === "acao"
                            ? "var(--color-accent)"
                            : "var(--color-ink-soft)",
                    }}
                  >
                    {situacao?.texto}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[13px] text-ink-soft">
                  {diasSemTreino === null ? "nunca" : diasSemTreino === 0 ? "hoje" : `${diasSemTreino}d atrás`}
                </td>
                <td className="px-4 py-3.5 text-[13px] text-ink-soft">
                  {aderencia !== null ? `${aderencia}%` : "—"}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={
                      mensagemAguardando
                        ? `/painel/admin/conversas/${aluno.id}`
                        : `/painel/admin/alunos/${aluno.id}`
                    }
                    className="rounded-[2px] border border-accent-border px-3 py-1.5 text-[11px] font-medium text-accent"
                  >
                    {mensagemAguardando ? "Responder" : situacao?.nivel === "risco" ? "Falar agora" : "Ver aluno"}
                  </Link>
                </td>
              </tr>
            ))}
            {filaAtencao.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-ink-soft">
                  Nenhum aluno precisando de atenção agora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function CartaoTriagem({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number | string;
  cor?: string;
}) {
  return (
    <div className="rounded-[4px] border border-line bg-card-admin p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">{titulo}</p>
      <p className="mt-2 text-[30px] font-semibold" style={{ color: cor ?? "var(--color-ink)" }}>
        {valor}
      </p>
    </div>
  );
}
