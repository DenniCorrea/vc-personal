import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

// Os 8 itens do handoff (tela 9), seguidos do que ja existia antes desse
// pacote e continua funcionando igual — so ganhou a casca nova.
const ITENS_SIDEBAR = [
  { href: "/painel/admin", rotulo: "Visão do dia" },
  { href: "/painel/admin/alunos", rotulo: "Alunos" },
  { href: "/painel/admin/treinos", rotulo: "Fichas de treino" },
  { href: "/painel/admin/nutricao", rotulo: "Planos alimentares" },
  { href: "/painel/admin/checkins", rotulo: "Check-ins" },
  { href: "/painel/admin/conversas", rotulo: "Mensagens" },
  { href: "/painel/admin/mensagens", rotulo: "Mentalidade do dia" },
  { href: "/painel/admin/planos", rotulo: "Planos e pagamentos" },
] as const;

const ITENS_SIDEBAR_OUTROS = [
  { href: "/painel/admin/assinaturas", rotulo: "Acesso cortesia" },
  { href: "/painel/admin/videos", rotulo: "Vídeos" },
  { href: "/painel/admin/exercicios", rotulo: "Exercícios" },
  { href: "/painel/admin/horarios", rotulo: "Horários" },
  { href: "/painel/admin/conteudo-mentoria", rotulo: "Conteúdo da mentoria" },
  { href: "/painel/admin/logs", rotulo: "Histórico de ações" },
] as const;

// Sidebar fixa do painel do admin (handoff, tela 9). Envolve TODAS as
// rotas /painel/admin/* — inclusive as que ja existiam antes desse
// handoff (planos, videos, exercicios, logs...), que so ganham a casca
// nova, sem mudar de conteudo.
export default async function LayoutAdmin({ children }: LayoutProps<"/painel/admin">) {
  const session = await exigirPapel("ADMIN");

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const [totalAlunos, checkinsAResponder] = await Promise.all([
    prisma.usuario.count({ where: { role: "ALUNO", ativo: true } }),
    // "A responder" = adaptacao dos ultimos 7 dias — sem um campo de "ja
    // revisado" no schema, usar so os recentes evita a lista crescer pra
    // sempre (nao e um estado "resolvido/pendente" de verdade ainda).
    prisma.checkinNutricional.count({ where: { status: "ADAPTOU", criadoEm: { gte: seteDiasAtras } } }),
  ]);

  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-line bg-panel px-5 py-6">
        <div>
          <p className="font-display text-[20px] text-ink">Método Líder</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Painel do consultor
          </p>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5">
          {ITENS_SIDEBAR.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-[2px] px-3 py-2.5 text-[13px] text-ink-soft hover:text-ink"
            >
              {item.rotulo}
              {item.href === "/painel/admin/alunos" && totalAlunos > 0 && (
                <span className="text-[12px] text-ink-faint">{totalAlunos}</span>
              )}
              {item.href === "/painel/admin/checkins" && checkinsAResponder > 0 && (
                <span className="text-[12px]" style={{ color: "var(--color-warn)" }}>
                  {checkinsAResponder}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Outros</p>
        <nav className="mt-1 flex flex-col gap-0.5">
          {ITENS_SIDEBAR_OUTROS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[2px] px-3 py-2 text-[12px] text-ink-faint hover:text-ink-soft"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-line pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent text-[12px] text-accent">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] text-ink">{session.user.name}</p>
            <p className="text-[11px] text-ink-faint">Consultor</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-x-auto px-9 py-9">{children}</div>
    </div>
  );
}
