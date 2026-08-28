import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "./BottomNav";
import { SidebarMentorado, BottomNavMentorado } from "./mentorado/MentoradoNav";

// ADMIN monta a propria casca (sidebar) dentro de /painel/admin/layout.tsx —
// passa direto por aqui. ALUNO ganha o app mobile do Metodo Lider (pausado
// desde 28/08/2026, ver AlunoPausado.tsx, mas a casca continua igual).
// PERSONAL_PARCEIRO ("mentorado", handoff_mentoria_b2b_metodo_lider) ganha a
// casca nova: sidebar 248px no desktop, bottom nav de 5 itens no mobile.
export default async function LayoutPainel({ children }: LayoutProps<"/painel">) {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "ALUNO") {
    return (
      <div className="pb-bottom-nav mx-auto min-h-dvh max-w-[520px]">
        {children}
        <BottomNav />
      </div>
    );
  }

  if (role === "PERSONAL_PARCEIRO") {
    const mensagensNaoLidas = await prisma.mensagem.count({
      where: { usuarioId: session!.user.id, autorId: { not: session!.user.id }, lida: false },
    });

    return (
      <div className="flex min-h-dvh">
        <SidebarMentorado nome={session!.user.name ?? ""} mensagensNaoLidas={mensagensNaoLidas} />
        <div className="min-w-0 flex-1 pb-bottom-nav lg:pb-0">
          <div className="mx-auto max-w-[1560px] px-6 pt-cabecalho-aluno lg:px-9 lg:pt-9">{children}</div>
        </div>
        <BottomNavMentorado mensagensNaoLidas={mensagensNaoLidas} />
      </div>
    );
  }

  return children;
}
