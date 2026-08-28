import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { sair } from "../actions";

// Sidebar reorganizada em 28/08/2026 pela pivotagem: o foco agora e a
// Mentoria B2B, entao ela vem primeiro. As telas do app de aluno continuam
// funcionando (nada foi apagado), mas ficam num grupo separado e rotulado
// como pausado — senao o Victor abre o painel e a primeira coisa que ve e
// um produto que ele desligou.
const ITENS_MENTORIA = [
  { href: "/painel/admin", rotulo: "Visão do dia" },
  { href: "/painel/admin/trilha", rotulo: "Trilha de conteúdo" },
  { href: "/painel/admin/bonus", rotulo: "Bônus" },
  { href: "/painel/admin/videos", rotulo: "Vídeos" },
  { href: "/painel/admin/conversas", rotulo: "Mensagens" },
  { href: "/painel/admin/comunidade", rotulo: "Comunidade" },
  { href: "/painel/admin/mensagens", rotulo: "Mentalidade do dia" },
  { href: "/painel/admin/horarios", rotulo: "Horários de sessão" },
  { href: "/painel/admin/planos", rotulo: "Planos e pagamentos" },
  { href: "/painel/admin/assinaturas", rotulo: "Acesso cortesia" },
] as const;

const ITENS_ALUNO_PAUSADO = [
  { href: "/painel/admin/alunos", rotulo: "Alunos" },
  { href: "/painel/admin/treinos", rotulo: "Fichas de treino" },
  { href: "/painel/admin/nutricao", rotulo: "Planos alimentares" },
  { href: "/painel/admin/checkins", rotulo: "Check-ins" },
  { href: "/painel/admin/exercicios", rotulo: "Exercícios" },
] as const;

const ITENS_OUTROS = [
  // Formato antigo de conteudo (Fase 8), substituido pela Trilha acima.
  // Fica aqui enquanto tiver conteudo que o Victor ainda nao migrou.
  { href: "/painel/admin/conteudo-mentoria", rotulo: "Conteúdo (formato antigo)" },
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
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Abaixo de 1024px a sidebar vira uma barra horizontal com scroll,
          no topo — sem drawer/JS, mas resolve o corte que existia antes
          (sidebar fixa de 236px comendo a tela toda no celular). */}
      <aside className="flex shrink-0 flex-col border-b border-line bg-panel px-5 py-4 lg:w-[236px] lg:border-r lg:border-b-0 lg:py-6">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="font-display text-[18px] text-ink lg:text-[20px]">Método Líder</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle lg:text-[11px]">
              Painel do consultor
            </p>
          </div>
          <div className="flex items-center gap-2 lg:mt-auto lg:border-t lg:border-line lg:pt-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent text-[11px] text-accent lg:h-8 lg:w-8 lg:text-[12px]">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-[13px] text-ink">{session.user.name}</p>
              <p className="text-[11px] text-ink-soft">Consultor</p>
            </div>
            <form action={sair}>
              <button
                type="submit"
                className="shrink-0 rounded-[2px] border border-line px-2.5 py-1.5 text-[11px] text-ink-soft hover:border-accent hover:text-ink lg:ml-2"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        <nav className="mt-4 flex gap-1 overflow-x-auto lg:mt-8 lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {ITENS_MENTORIA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center justify-between gap-1.5 whitespace-nowrap rounded-[2px] px-3 py-2 text-[12px] text-ink-soft hover:text-ink lg:py-2.5 lg:text-[13px]"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle lg:mt-6">
          Área de aluno · pausada
        </p>
        <nav className="mt-1 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {ITENS_ALUNO_PAUSADO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center justify-between gap-1.5 whitespace-nowrap rounded-[2px] px-3 py-2 text-[12px] text-ink-soft hover:text-ink"
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

        <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle lg:mt-6">
          Outros
        </p>
        <nav className="mt-1 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {ITENS_OUTROS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-[2px] px-3 py-2 text-[12px] text-ink-soft hover:text-ink"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-x-auto px-5 py-6 lg:px-9 lg:py-9">{children}</div>
    </div>
  );
}
