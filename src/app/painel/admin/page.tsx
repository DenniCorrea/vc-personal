import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";

const formatoHoje = formatador({ weekday: "long", day: "2-digit", month: "long" });
const formatoHora = formatador({ hour: "2-digit", minute: "2-digit" });
const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Visao do dia do mentor (handoff, tela 6a). Reescrita em 28/08/2026 pela
// pivotagem: antes era triagem de ALUNO (sem treino ha 3 dias, check-in
// nutricional). Agora e triagem de MENTORADO — o produto que esta ativo.
// A regra do handoff continua a mesma: cada linha oferece a acao que
// resolve o caso, porque a triagem E o produto aqui.
export default async function PaginaAdminVisaoDoDia() {
  await exigirPapel("ADMIN");

  const agora = new Date();
  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(inicioDoDia);
  fimDoDia.setDate(fimDoDia.getDate() + 1);
  const quatorzeDiasAtras = new Date(agora.getTime() - 14 * 86_400_000);

  const [mentorados, sessoesHoje, duvidas, receita, postsSemResposta] = await Promise.all([
    prisma.usuario.findMany({
      where: { role: "PERSONAL_PARCEIRO", ativo: true },
      select: {
        id: true,
        nome: true,
        assinaturas: {
          where: { status: "ATIVA" },
          include: { plano: { select: { nome: true, preco: true } } },
          take: 1,
        },
        progressoAulas: { orderBy: { atualizadoEm: "desc" }, take: 1, select: { atualizadoEm: true } },
        mensagens: { orderBy: { criadoEm: "desc" }, take: 1, select: { autorId: true, lida: true } },
      },
    }),
    prisma.agendamento.findMany({
      where: {
        status: { not: "CANCELADO" },
        horario: { inicio: { gte: inicioDoDia, lt: fimDoDia }, produto: "MENTORIA" },
      },
      orderBy: { horario: { inicio: "asc" } },
      include: {
        usuario: { select: { id: true, nome: true } },
        horario: { select: { inicio: true } },
        assinatura: { include: { plano: { select: { nome: true } } } },
      },
    }),
    prisma.mensagem.findMany({
      where: { aulaId: { not: null } },
      select: { usuarioId: true, autorId: true, criadoEm: true },
    }),
    prisma.assinatura.findMany({
      where: { status: "ATIVA", plano: { produto: "MENTORIA" } },
      include: { plano: { select: { nome: true, preco: true } } },
    }),
    prisma.post.count({ where: { oculto: false, comentarios: { none: { autor: { role: "ADMIN" } } } } }),
  ]);

  // Duvida aberta = ancorada numa aula, escrita pelo mentorado, sem
  // resposta do Victor depois dela na mesma thread.
  const duvidasAbertas = duvidas.filter(
    (d) =>
      d.autorId === d.usuarioId &&
      !duvidas.some((r) => r.usuarioId === d.usuarioId && r.autorId !== d.usuarioId && r.criadoEm > d.criadoEm),
  ).length;

  const inativos = mentorados.filter((m) => {
    if (m.assinaturas.length === 0) return false;
    const ultimo = m.progressoAulas[0]?.atualizadoEm;
    return !ultimo || ultimo < quatorzeDiasAtras;
  });

  const mrr = receita.reduce((s, a) => s + Number(a.plano.preco), 0);

  const fila = mentorados
    .map((m) => {
      const assinatura = m.assinaturas[0];
      const ultimaMsg = m.mensagens[0];
      const aguardando = ultimaMsg && ultimaMsg.autorId === m.id && !ultimaMsg.lida;
      const ultimoAcesso = m.progressoAulas[0]?.atualizadoEm ?? null;
      const diasSumido = ultimoAcesso
        ? Math.floor((agora.getTime() - ultimoAcesso.getTime()) / 86_400_000)
        : null;

      if (aguardando)
        return { m, assinatura, situacao: "Mensagem aguardando resposta", nivel: "acao" as const,
                 acao: { rotulo: "Responder", href: `/painel/admin/conversas/${m.id}` } };
      if (!assinatura)
        return { m, assinatura, situacao: "Sem plano ativo", nivel: "risco" as const,
                 acao: { rotulo: "Ver planos", href: "/painel/admin/planos" } };
      if (diasSumido === null)
        return { m, assinatura, situacao: "Nunca abriu uma aula", nivel: "risco" as const,
                 acao: { rotulo: "Chamar", href: `/painel/admin/conversas/${m.id}` } };
      if (diasSumido >= 14)
        return { m, assinatura, situacao: `Sem acesso há ${diasSumido} dias`, nivel: "risco" as const,
                 acao: { rotulo: "Chamar", href: `/painel/admin/conversas/${m.id}` } };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => (a.nivel === "risco" ? -1 : 1) - (b.nivel === "risco" ? -1 : 1));

  return (
    <main>
      <p className="text-[12px] capitalize text-ink-soft">{formatoHoje.format(agora)}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] text-ink lg:text-[34px]">Quem precisa de você hoje</h1>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/painel/admin/trilha/aula/novo"
            className="rounded-[2px] border border-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent-border"
          >
            Nova aula
          </Link>
          <Link
            href="/painel/admin/mensagens/novo"
            className="rounded-[2px] bg-accent px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
          >
            Publicar mentalidade
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Cartao titulo="Dúvidas a responder" valor={duvidasAbertas} href="/painel/admin/duvidas" destaque />
        <Cartao
          titulo="Sessões hoje"
          valor={sessoesHoje.length}
          rodape={sessoesHoje[0] ? `Próxima às ${formatoHora.format(sessoesHoje[0].horario.inicio)}` : undefined}
          href="/painel/admin/horarios"
        />
        <Cartao titulo="Sem acesso há 14+ dias" valor={inativos.length} rodape="Risco de cancelamento" />
        <Cartao
          titulo="Receita recorrente"
          valor={formatoMoeda.format(mrr)}
          rodape={`${receita.length} assinatura${receita.length === 1 ? "" : "s"} ativa${receita.length === 1 ? "" : "s"}`}
          cor="var(--color-accent)"
        />
      </div>

      {postsSemResposta > 0 && (
        <Link
          href="/painel/admin/comunidade"
          className="mt-4 flex items-center gap-2.5 rounded-[4px] border border-accent-border p-4 text-[13px] text-ink hover:bg-accent-wash"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {postsSemResposta} {postsSemResposta === 1 ? "post" : "posts"} na comunidade sem sua resposta
        </Link>
      )}

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">Fila de atenção</p>
      {fila.length === 0 ? (
        <div className="mt-3 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">Ninguém precisa de atenção agora.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-[4px] border border-line">
          <table className="w-full border-collapse text-left" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-4 py-3" style={{ minWidth: 180 }}>Mentorado</th>
                <th className="px-4 py-3" style={{ minWidth: 200 }}>Situação</th>
                <th className="px-4 py-3 w-[140px]">Plano</th>
                <th className="px-4 py-3 w-[120px]"></th>
              </tr>
            </thead>
            <tbody>
              {fila.map(({ m, assinatura, situacao, nivel, acao }) => (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-accent-wash">
                  <td className="px-4 py-3.5 text-[15px] text-ink">{m.nome}</td>
                  <td
                    className="px-4 py-3.5 text-[13px]"
                    style={{ color: nivel === "risco" ? "var(--color-warn)" : "var(--color-accent)" }}
                  >
                    {situacao}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-ink-soft">{assinatura?.plano.nome ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={acao.href} className="text-[12px] font-medium text-accent">
                      {acao.rotulo}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sessoesHoje.length > 0 && (
        <>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">Agenda de hoje</p>
          <div className="mt-3 flex flex-col gap-2">
            {sessoesHoje.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-4 rounded-[4px] border p-4"
                style={{
                  borderColor: i === 0 ? "var(--color-accent-border)" : "var(--color-line)",
                  background: i === 0 ? "var(--color-accent-wash)" : "var(--color-card)",
                }}
              >
                <span className="font-mono text-[14px] text-ink">{formatoHora.format(s.horario.inicio)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-ink">{s.usuario.nome}</p>
                  <p className="text-[12px] text-ink-soft">{s.assinatura.plano.nome}</p>
                </div>
                <Link href={`/painel/admin/conversas/${s.usuario.id}`} className="text-[12px] font-medium text-accent">
                  Ver notas
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-[12px] leading-relaxed text-ink-faint">
        A área de aluno está pausada — a triagem de treino e nutrição continua acessível na
        seção &quot;Área de aluno&quot; do menu.
      </p>
    </main>
  );
}

function Cartao({
  titulo,
  valor,
  rodape,
  cor,
  href,
  destaque,
}: {
  titulo: string;
  valor: number | string;
  rodape?: string;
  cor?: string;
  href?: string;
  destaque?: boolean;
}) {
  const conteudo = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">{titulo}</p>
      <p
        className="mt-2 text-[30px] font-semibold leading-none"
        style={{ color: cor ?? "var(--color-ink)", letterSpacing: "-0.02em" }}
      >
        {valor}
      </p>
      {rodape && <p className="mt-1.5 text-[12px] text-ink-soft">{rodape}</p>}
    </>
  );

  const estilo = destaque
    ? {
        borderColor: "var(--color-accent-border)",
        background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))",
      }
    : { borderColor: "var(--color-line)", background: "var(--color-card)" };

  return href ? (
    <Link href={href} className="block rounded-[4px] border p-5 hover:border-accent-border" style={estilo}>
      {conteudo}
    </Link>
  ) : (
    <div className="rounded-[4px] border p-5" style={estilo}>
      {conteudo}
    </div>
  );
}
