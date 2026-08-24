import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export default async function PaginaAdminAlunos() {
  await exigirPapel("ADMIN");

  const alunos = await prisma.usuario.findMany({
    where: { role: "ALUNO", ativo: true },
    include: { assinaturas: { where: { status: "ATIVA" }, include: { plano: true }, take: 1 } },
    orderBy: { nome: "asc" },
  });

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Alunos</h1>

      <div className="mt-6 overflow-hidden rounded-[4px] border border-line">
        {alunos.map((aluno) => (
          <Link
            key={aluno.id}
            href={`/painel/admin/alunos/${aluno.id}`}
            className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0 hover:bg-accent-wash"
          >
            <div>
              <p className="text-[14px] text-ink">{aluno.nome}</p>
              <p className="text-[12px] text-ink-soft">{aluno.assinaturas[0]?.plano.nome ?? "Sem plano ativo"}</p>
            </div>
            <span className="text-ink-faint">→</span>
          </Link>
        ))}
        {alunos.length === 0 && <p className="px-4 py-6 text-[13px] text-ink-soft">Nenhum aluno ainda.</p>}
      </div>
    </main>
  );
}
