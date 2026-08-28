"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "../actions";

// Casca do mentorado (handoff_mentoria_b2b_metodo_lider, README "Navegacao").
// Desktop: sidebar fixa 248px. Mobile: bottom nav de 5 itens, com o resto
// acessivel pelo Inicio (handoff: "Minhas sessoes, Materiais, Meu plano
// ficam acessiveis pelo Inicio e pelo avatar/perfil").
// "Módulos" aponta pra /painel/mentoria (a tela de conteudo por pilar que
// ja existe e ja tem conteudo publicado pelo Victor), NAO pra uma tela nova
// vazia: a trilha estruturada (Modulo/Aula) ainda nao tem nem dado nem a
// tela de gestao no painel do mentor pra alimenta-la. Quando ela existir,
// e so trocar esse href — o rotulo pro mentorado ja e o definitivo.
const ITENS_PRINCIPAIS = [
  { href: "/painel", rotulo: "Início", icone: IconeInicio },
  { href: "/painel/mentoria", rotulo: "Módulos", icone: IconeModulos },
  { href: "/painel/bonus", rotulo: "Bônus", icone: IconeBonus },
  { href: "/painel/comunidade", rotulo: "Comunidade", icone: IconeComunidade },
] as const;

const ITEM_VICTOR = { href: "/painel/mensagens", rotulo: "Fale com o Victor", rotuloCurto: "Victor", icone: IconeVictor };

const ITENS_SECUNDARIOS = [
  { href: "/painel/agenda", rotulo: "Minhas sessões" },
  { href: "/painel/materiais", rotulo: "Materiais" },
  { href: "/painel/planos", rotulo: "Meu plano" },
  // Sem esse item o mentorado nao alcanca trocar senha, baixar os proprios
  // dados nem pedir exclusao de conta (LGPD art. 18) — o /painel/dados so
  // era linkado das telas do ALUNO, que estao pausadas.
  { href: "/painel/dados", rotulo: "Minha conta" },
] as const;

function estaAtivo(pathname: string, href: string) {
  return href === "/painel" ? pathname === "/painel" : pathname.startsWith(href);
}

export function SidebarMentorado({ nome, mensagensNaoLidas }: { nome: string; mensagensNaoLidas: number }) {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line lg:flex"
      style={{ background: "var(--color-panel)" }}
    >
      <div className="px-6 pt-8 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Método Líder</p>
        <p className="font-display mt-1 text-[19px] text-ink">Mentoria</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {ITENS_PRINCIPAIS.map((item) => (
          <ItemSidebar key={item.href} {...item} ativo={estaAtivo(pathname, item.href)} />
        ))}
        <ItemSidebar
          href={ITEM_VICTOR.href}
          rotulo={ITEM_VICTOR.rotulo}
          icone={ITEM_VICTOR.icone}
          ativo={estaAtivo(pathname, ITEM_VICTOR.href)}
          badge={mensagensNaoLidas > 0 ? mensagensNaoLidas : undefined}
        />

        <div className="my-3 border-t border-line" />

        {ITENS_SECUNDARIOS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[2px] px-3.5 py-2.5 text-[13px] font-medium transition-colors"
            style={{
              color: estaAtivo(pathname, item.href) ? "var(--color-accent)" : "var(--color-ink-soft)",
              background: estaAtivo(pathname, item.href) ? "var(--color-accent-wash)" : "transparent",
            }}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-4">
        <p className="truncate text-[13px] font-medium text-ink">{nome}</p>
        <form action={sair}>
          <button type="submit" className="shrink-0 text-[12px] text-ink-soft hover:text-ink">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

function ItemSidebar({
  href,
  rotulo,
  icone: Icone,
  ativo,
  badge,
}: {
  href: string;
  rotulo: string;
  icone: () => React.ReactElement;
  ativo: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[2px] px-3.5 py-2.5 text-[13px] font-medium transition-colors"
      style={{
        color: ativo ? "var(--color-accent)" : "var(--color-ink-soft)",
        background: ativo ? "var(--color-accent-wash)" : "transparent",
        borderLeft: ativo ? "2px solid var(--color-accent)" : "2px solid transparent",
      }}
    >
      <Icone />
      <span className="flex-1">{rotulo}</span>
      {badge != null && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-ink">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function BottomNavMentorado({ mensagensNaoLidas }: { mensagensNaoLidas: number }) {
  const pathname = usePathname();
  const itens = [...ITENS_PRINCIPAIS, { href: ITEM_VICTOR.href, rotulo: ITEM_VICTOR.rotuloCurto, icone: ITEM_VICTOR.icone }];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      style={{ background: "rgba(12,11,9,0.95)" }}
    >
      <div className="mx-auto flex max-w-[520px] items-stretch justify-between px-3 pt-3.5 pb-3">
        {itens.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          const Icone = item.icone;
          const temBadge = item.href === ITEM_VICTOR.href && mensagensNaoLidas > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-11 flex-1 flex-col items-center gap-1 text-[10px] font-medium"
              // ink-soft (0.55) e nao 0.45: rotulo de navegacao precisa passar
              // no contraste minimo (0.45 da 3.75, abaixo dos 4.5 exigidos
              // pra texto pequeno). Os alfas menores do handoff sao pra
              // placeholder e metadado, nao pra item de menu.
              style={{ color: ativo ? "var(--color-accent)" : "var(--color-ink-soft)" }}
            >
              <Icone />
              {item.rotulo}
              {temBadge && (
                <span className="absolute right-[26%] top-0 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function IconeInicio() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}
function IconeModulos() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconeBonus() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function IconeComunidade() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10.5" r="2.5" />
      <path d="M3.5 19c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5M14.5 15.2c2 .2 3.4 1.4 3.8 3.8" />
    </svg>
  );
}
function IconeVictor() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 6h16v11H9l-5 4V6Z" />
    </svg>
  );
}
