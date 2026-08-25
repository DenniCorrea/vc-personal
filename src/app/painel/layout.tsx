import { auth } from "@/auth";
import { BottomNav } from "./BottomNav";

// So o ALUNO ganha a casca "app mobile" (bottom nav) do handoff — e a unica
// area coberta pelo design_handoff_metodo_lider. PERSONAL_PARCEIRO e ADMIN
// continuam com o layout simples de sempre (o ADMIN monta a propria casca,
// com sidebar, dentro de /painel/admin/layout.tsx).
export default async function LayoutPainel({ children }: LayoutProps<"/painel">) {
  const session = await auth();
  const ehAluno = session?.user?.role === "ALUNO";

  if (!ehAluno) {
    return children;
  }

  return (
    <div className="pb-bottom-nav mx-auto min-h-dvh max-w-[520px]">
      {children}
      <BottomNav />
    </div>
  );
}
