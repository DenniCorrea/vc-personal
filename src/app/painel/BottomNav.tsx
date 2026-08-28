"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 5 itens fixos do app do aluno (handoff, tela 1b). Icones sao formas
// simples de traco (1.5px), sem preenchimento — nada de icon set externo.
const ITENS = [
  { href: "/painel", rotulo: "Hoje", icone: IconeHoje },
  { href: "/painel/treinos", rotulo: "Treino", icone: IconeTreino },
  { href: "/painel/nutricao", rotulo: "Nutrição", icone: IconeNutricao },
  { href: "/painel/evolucao", rotulo: "Evolução", icone: IconeEvolucao },
  { href: "/painel/dados", rotulo: "Perfil", icone: IconePerfil },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      style={{ background: "rgba(16,15,13,0.94)" }}
    >
      <div className="mx-auto flex max-w-[520px] items-stretch justify-between px-3 pt-3.5 pb-3">
        {ITENS.map((item) => {
          const ativo = item.href === "/painel" ? pathname === "/painel" : pathname.startsWith(item.href);
          const Icone = item.icone;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 flex-1 flex-col items-center gap-1 text-[10px] font-medium"
              // Mesmo motivo da nav do mentorado: rotulo de menu precisa
              // passar no contraste minimo, e 0.45 nao passa.
              style={{ color: ativo ? "var(--color-accent)" : "var(--color-ink-soft)" }}
            >
              <Icone />
              {item.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function IconeHoje() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16" />
    </svg>
  );
}

function IconeTreino() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 8v8M18 8v8M2 11v2M22 11v2M6 12h12" />
    </svg>
  );
}

function IconeNutricao() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v9M8 3c0 3-1.5 4-1.5 4v14M15.5 3s-.5 2.5-.5 5 1.5 3 1.5 3v10" />
    </svg>
  );
}

function IconeEvolucao() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17l5-5 4 4 8-9" />
    </svg>
  );
}

function IconePerfil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  );
}
