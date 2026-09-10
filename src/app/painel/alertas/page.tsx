import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao, bloquearAlunoPausado } from "@/lib/auth-guard";
import { marcarComoLido, marcarTodosComoLidos, verificarAlertasAgora } from "./actions";
import type { TipoAlerta } from "@/generated/prisma/enums";
import { formatador } from "@/lib/data";

const formatoDataHora = formatador({
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// Severidade por tipo (handoff, tela 15/4d): vermelho = acao urgente,
// accent = recado/algo que precisa de atencao, cinza = informativo.
const SEVERIDADE: Record<TipoAlerta, { rotulo: string; cor: "urgente" | "accent" | "muted" }> = {
  ASSINATURA_ATRASADA: { rotulo: "Atenção", cor: "urgente" },
  RENOVACAO_PROXIMA: { rotulo: "Assinatura", cor: "accent" },
  ALUNO_SEM_RENOVACAO: { rotulo: "Aluno", cor: "urgente" },
  HABITO_AGUA: { rotulo: "Hábitos", cor: "muted" },
  HABITO_SONO: { rotulo: "Hábitos", cor: "muted" },
  AGENDA: { rotulo: "Agenda", cor: "muted" },
  SOLICITACAO_EXCLUSAO: { rotulo: "LGPD", cor: "urgente" },
  MODERACAO: { rotulo: "Comunidade", cor: "urgente" },
};

const CORES = {
  urgente: "var(--color-warn)",
  accent: "var(--color-accent)",
  muted: "var(--color-ink-faint)",
};

export default async function PaginaAlertas() {
  const session = await exigirSessao();
  bloquearAlunoPausado(session.user.role);

  const alertas = await prisma.alerta.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-cabecalho-aluno pb-10">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          {naoLidos} não lido{naoLidos === 1 ? "" : "s"}
        </p>
        {naoLidos > 0 && (
          <form action={marcarTodosComoLidos}>
            <button type="submit" className="text-[12px] font-medium text-accent">
              Marcar lidos
            </button>
          </form>
        )}
      </div>
      <h1 className="font-display mt-1 text-[26px] text-ink">Alertas</h1>

      {session.user.role === "ADMIN" && (
        <form action={verificarAlertasAgora} className="mt-3">
          <button
            type="submit"
            className="rounded-[2px] border border-line px-4 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
          >
            Verificar alertas agora
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {alertas.map((alerta) => {
          const sev = SEVERIDADE[alerta.tipo];
          const cor = CORES[sev.cor];
          return (
            <div
              key={alerta.id}
              className="flex items-start justify-between gap-3 rounded-[4px] border-y border-r p-4"
              style={{
                borderColor: "var(--color-line)",
                borderLeft: `2px solid ${cor}`,
                background: "var(--color-card)",
                opacity: alerta.lido ? 0.65 : 1,
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: cor }}>
                    {sev.rotulo}
                  </p>
                  <p className="text-[11px] text-ink-faint">{formatoDataHora.format(alerta.criadoEm)}</p>
                </div>
                <p className="mt-1 text-[14px] text-ink">{alerta.mensagem}</p>
              </div>
              {!alerta.lido && (
                <form action={marcarComoLido.bind(null, alerta.id)}>
                  <button type="submit" className="shrink-0 text-[12px] text-ink-soft hover:text-ink">
                    Marcar lido
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {alertas.length === 0 && <p className="text-[13px] text-ink-soft">Nenhum alerta ainda.</p>}
      </div>

      <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
