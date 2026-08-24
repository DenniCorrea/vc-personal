import Link from "next/link";
import { sair } from "./actions";

const ROTULO_ROLE: Record<string, string> = {
  PERSONAL_PARCEIRO: "Personal Trainer Mentorado",
  ADMIN: "Administrador",
};

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente de pagamento",
  ATIVA: "Ativa",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

type Props = {
  nome: string;
  role: string;
  alertasNaoLidos: number;
  assinatura: {
    plano: { nome: string };
    status: string;
    cortesia: boolean;
  } | null;
};

// Painel generico (nao redesenhado pelo handoff Metodo Lider — que so cobre
// o app do ALUNO e o painel do ADMIN em telas especificas). Mantido como
// estava nas Fases 1-11, so herdando os tokens visuais novos.
export function DashboardAdminOuPersonal({ nome, role, alertasNaoLidos, assinatura }: Props) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          {ROTULO_ROLE[role] ?? role}
        </p>
        <Link
          href="/painel/alertas"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          Alertas
          {alertasNaoLidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink">
              {alertasNaoLidos}
            </span>
          )}
        </Link>
      </div>
      <h1 className="font-display mt-1 text-3xl font-semibold text-ink">Bem-vindo, {nome}</h1>

      {role === "ADMIN" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/painel/admin/planos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar planos
          </Link>
          <Link
            href="/painel/admin/horarios"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar horários
          </Link>
          <Link
            href="/painel/admin/videos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar vídeos
          </Link>
          <Link
            href="/painel/admin/exercicios"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar exercícios
          </Link>
          <Link
            href="/painel/admin/treinos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar treinos
          </Link>
          <Link
            href="/painel/admin/conteudo-mentoria"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar conteúdo da mentoria
          </Link>
          <Link
            href="/painel/admin/mensagens"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar mensagens
          </Link>
          <Link
            href="/painel/admin/assinaturas"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Acesso cortesia
          </Link>
          <Link
            href="/painel/admin/logs"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Histórico de ações
          </Link>
          <Link
            href="/painel/admin"
            className="inline-block rounded-lg border border-accent-border px-4 py-2 text-sm font-medium text-accent"
          >
            Visão do dia (novo)
          </Link>
        </div>
      )}

      {role !== "ADMIN" && (
        <div className="mt-6 rounded-lg border border-line bg-paper-raised px-4 py-3">
          {assinatura ? (
            <>
              <p className="font-medium text-ink">{assinatura.plano.nome}</p>
              <p className="text-sm text-ink-soft">
                Status: {ROTULO_STATUS[assinatura.status] ?? assinatura.status}
                {assinatura.cortesia && " · Cortesia"}
              </p>
              {assinatura.status === "ATIVA" && (
                <div className="mt-2 flex flex-wrap gap-4">
                  <Link href="/painel/agenda" className="text-sm font-medium text-accent">
                    Ver agenda
                  </Link>
                  <Link href="/painel/videos" className="text-sm font-medium text-accent">
                    Ver vídeos
                  </Link>
                  <Link href="/painel/mentoria" className="text-sm font-medium text-accent">
                    Ver conteúdo da mentoria
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">Você ainda não escolheu um plano.</p>
              <Link href="/painel/planos" className="mt-2 inline-block text-sm font-medium text-accent">
                Ver planos disponíveis
              </Link>
            </>
          )}
        </div>
      )}

      {role !== "ADMIN" && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/painel/habitos" className="text-sm font-medium text-accent">
            Água, sono e mentalidade
          </Link>
          <Link href="/painel/dados" className="text-sm font-medium text-ink-soft hover:text-ink">
            Seus dados (LGPD)
          </Link>
        </div>
      )}

      <form action={sair} className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:border-accent"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
