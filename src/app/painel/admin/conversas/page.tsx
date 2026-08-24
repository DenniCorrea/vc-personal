import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export default async function PaginaAdminConversas() {
  await exigirPapel("ADMIN");

  const alunos = await prisma.usuario.findMany({
    where: { role: { in: ["ALUNO", "PERSONAL_PARCEIRO"] }, ativo: true, mensagens: { some: {} } },
    include: { mensagens: { orderBy: { criadoEm: "desc" }, take: 1 } },
  });

  const ordenadas = alunos
    .filter((a) => a.mensagens[0])
    .sort((a, b) => b.mensagens[0].criadoEm.getTime() - a.mensagens[0].criadoEm.getTime());

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Mensagens</h1>

      <div className="mt-6 overflow-hidden rounded-[4px] border border-line">
        {ordenadas.map((aluno) => {
          const ultima = aluno.mensagens[0];
          const naoLida = ultima.autorId === aluno.id && !ultima.lida;
          return (
            <Link
              key={aluno.id}
              href={`/painel/admin/conversas/${aluno.id}`}
              className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0 hover:bg-accent-wash"
            >
              <div className="min-w-0">
                <p className="text-[14px] text-ink">{aluno.nome}</p>
                <p className="truncate text-[12px] text-ink-soft">{ultima.texto}</p>
              </div>
              {naoLida && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </Link>
          );
        })}
        {ordenadas.length === 0 && (
          <p className="px-4 py-6 text-[13px] text-ink-soft">Nenhuma conversa ainda.</p>
        )}
      </div>
    </main>
  );
}
