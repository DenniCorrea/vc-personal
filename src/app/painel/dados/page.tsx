import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { solicitarExclusaoConta } from "./actions";
import { sair } from "../actions";
import { TrocarSenhaForm } from "./TrocarSenhaForm";
import { TrocarFotoForm } from "./TrocarFotoForm";
import { formatador } from "@/lib/data";

const formatoData = formatador({ day: "2-digit", month: "long", year: "numeric" });
const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_METODO: Record<string, string> = { CARTAO: "Cartão", DEBITO: "Débito", PIX: "Pix" };

export default async function PaginaMeusDados() {
  const session = await exigirSessao();
  // Tres papeis, tres versoes desta tela. Antes so havia `ehAluno = role
  // !== "ADMIN"`, o que jogava o PERSONAL_PARCEIRO no molde do aluno e
  // mostrava pra ele "Aluno desde", link de Anamnese (que redireciona pra
  // fora, porque a rota e so de ALUNO) e altura/peso que ele nunca tem.
  // Ficou visivel quando o mentorado passou a ter essa tela no menu.
  const ehAluno = session.user.role === "ALUNO";
  const ehMentorado = session.user.role === "PERSONAL_PARCEIRO";
  const temAssinatura = ehAluno || ehMentorado;

  const [usuario, assinatura, ultimaAvaliacao, anamnese, habitoAgua, habitoSono] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { nome: true, email: true, telefone: true, avatarUrl: true, criadoEm: true },
    }),
    temAssinatura
      ? prisma.assinatura.findFirst({
          where: { usuarioId: session.user.id, status: { in: ["ATIVA", "PENDENTE", "ATRASADA"] } },
          include: { plano: true, pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 } },
        })
      : null,
    ehAluno
      ? prisma.avaliacao.findFirst({ where: { usuarioId: session.user.id }, orderBy: { data: "desc" } })
      : null,
    ehAluno ? prisma.anamnese.findUnique({ where: { usuarioId: session.user.id } }) : null,
    ehAluno
      ? prisma.habito.findUnique({ where: { usuarioId_tipo: { usuarioId: session.user.id, tipo: "AGUA" } } })
      : null,
    ehAluno
      ? prisma.habito.findUnique({ where: { usuarioId_tipo: { usuarioId: session.user.id, tipo: "SONO" } } })
      : null,
  ]);

  const rotuloPapel = ehAluno ? "Aluno" : ehMentorado ? "Mentorado" : "Consultor";

  return (
    <main className="mx-auto max-w-md pb-10 lg:mx-0">
      <div className="flex items-center gap-4">
        {usuario?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-accent object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent text-xl text-accent">
            {usuario?.nome.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display truncate text-[24px] text-ink">{usuario?.nome}</h1>
          {usuario?.criadoEm && (
            <p className="text-[13px] text-ink-soft">
              {rotuloPapel} desde {formatoData.format(usuario.criadoEm)}
            </p>
          )}
          <TrocarFotoForm />
        </div>
      </div>

      {temAssinatura && assinatura && (
        <section
          className="mt-6 rounded-[4px] border border-accent-border p-5"
          style={{ background: "linear-gradient(160deg, rgba(203,163,92,0.08), rgba(203,163,92,0.02))" }}
        >
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Plano ativo</p>
            <p className="text-[12px] text-ink-faint">
              Renova em {formatoData.format(assinatura.dataProximaRenovacao)}
            </p>
          </div>
          <p className="mt-1 text-[19px] font-semibold text-ink">{assinatura.plano.nome}</p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {formatoMoeda.format(Number(assinatura.plano.preco))}/mês
            {assinatura.pagamentos[0] && ` · ${ROTULO_METODO[assinatura.pagamentos[0].metodo]}`}
            {assinatura.cortesia && " · Cortesia"}
          </p>
          <div className="mt-4 flex gap-2.5">
            <Link
              href="/painel/planos?trocar=1"
              className="rounded-[2px] border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent-border"
            >
              Mudar plano
            </Link>
            <Link
              href="/painel/planos"
              className="rounded-[2px] border border-accent-border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent"
            >
              Pagamentos
            </Link>
          </div>
        </section>
      )}

      {/* E-mail e telefone valem pra qualquer papel. Altura/peso e anamnese
          sao do acompanhamento de treino — so fazem sentido pro ALUNO. */}
      <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Meus dados</p>
        <div className="mt-3 flex flex-col divide-y divide-line">
          <LinhaDado rotulo="E-mail" valor={usuario?.email ?? "—"} />
          <LinhaDado rotulo="Telefone" valor={usuario?.telefone ?? "—"} />
          {ehAluno && (
            <LinhaDado
              rotulo="Altura · peso"
              valor={
                ultimaAvaliacao?.altura || ultimaAvaliacao?.peso
                  ? `${ultimaAvaliacao.altura ? `${ultimaAvaliacao.altura} cm` : "—"} · ${ultimaAvaliacao.peso ? `${ultimaAvaliacao.peso} kg` : "—"}`
                  : "—"
              }
            />
          )}
          {ehAluno && (
            <div className="flex items-center justify-between py-2.5 text-[14px]">
              <span className="text-ink-soft">Anamnese</span>
              <Link href="/painel/anamnese" className="font-medium text-accent">
                {anamnese ? "Revisar" : "Responder"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {ehAluno && (habitoAgua || habitoSono) && (
        <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Metas diárias</p>
          <div className="mt-3 flex flex-col divide-y divide-line">
            {habitoAgua && <LinhaDado rotulo="Água" valor={`${habitoAgua.metaValor} L`} />}
            {habitoSono && <LinhaDado rotulo="Sono" valor={`${habitoSono.metaValor}h`} />}
          </div>
          <p className="mt-3 text-[12px] text-ink-faint">
            Definidas pelo Victor. Fale com ele para ajustar.
          </p>
        </section>
      )}

      <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Trocar senha</p>
        <TrocarSenhaForm />
      </section>

      <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">LGPD</p>
        <p className="mt-2 text-[13px] text-ink-soft">
          Você pode baixar tudo que guardamos sobre você, ou pedir a exclusão da sua conta.
        </p>
        <a
          href="/api/meus-dados"
          className="mt-3 inline-block rounded-[2px] border border-line px-4 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
        >
          Baixar meus dados
        </a>
      </section>

      <section
        className="mt-4 rounded-[4px] border p-5"
        style={{ borderColor: "var(--color-warn)", background: "rgba(192,72,59,0.07)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-warn)" }}>
          Excluir minha conta
        </p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--color-warn)" }}>
          Sua conta é desativada imediatamente e o Victor recebe um aviso pra apagar seus dados
          definitivamente, exceto o que a lei exigir manter (ex: registro de pagamento pra
          contabilidade). Essa ação desconecta você agora.
        </p>
        <form action={solicitarExclusaoConta} className="mt-3">
          <button
            type="submit"
            className="rounded-[2px] border px-4 py-2 text-[12px] font-medium"
            style={{ borderColor: "var(--color-warn)", color: "var(--color-warn)" }}
          >
            Solicitar exclusão da conta
          </button>
        </form>
      </section>

      {ehAluno && (
        <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Outros acessos</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/painel/agenda" className="text-[13px] font-medium text-accent">
              Agenda
            </Link>
            <Link href="/painel/videos" className="text-[13px] font-medium text-accent">
              Vídeos
            </Link>
            <Link href="/painel/alertas" className="text-[13px] font-medium text-accent">
              Alertas
            </Link>
            <Link href="/painel/habitos" className="text-[13px] font-medium text-accent">
              Água, sono e mentalidade
            </Link>
          </div>
        </section>
      )}

      <form action={sair} className="mt-6">
        <button
          type="submit"
          className="rounded-[2px] border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent-border"
        >
          Sair
        </button>
      </form>

      <Link href="/painel" className="mt-6 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}

function LinhaDado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[14px]">
      <span className="text-ink-soft">{rotulo}</span>
      <span className="font-medium text-ink">{valor}</span>
    </div>
  );
}
