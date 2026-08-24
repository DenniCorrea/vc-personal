import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export default async function PaginaAdminNutricao() {
  await exigirPapel("ADMIN");

  const alunos = await prisma.usuario.findMany({
    where: {
      role: "ALUNO",
      ativo: true,
      assinaturas: { some: { status: "ATIVA", plano: { incluiNutricao: true } } },
    },
    include: { planoNutricional: { include: { _count: { select: { refeicoes: true } } } } },
    orderBy: { nome: "asc" },
  });

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Planos alimentares</h1>
      <p className="mt-2 text-[13px] text-ink-soft">Só alunos com nutrição incluída no plano aparecem aqui.</p>

      <div className="mt-6 overflow-hidden rounded-[4px] border border-line">
        {alunos.map((aluno) => (
          <Link
            key={aluno.id}
            href={`/painel/admin/nutricao/${aluno.id}`}
            className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0 hover:bg-accent-wash"
          >
            <p className="text-[14px] text-ink">{aluno.nome}</p>
            <p className="text-[12px] text-ink-soft">
              {aluno.planoNutricional?._count.refeicoes ?? 0} refeições cadastradas
            </p>
          </Link>
        ))}
        {alunos.length === 0 && (
          <p className="px-4 py-6 text-[13px] text-ink-soft">Nenhum aluno com nutrição incluída no plano ainda.</p>
        )}
      </div>
    </main>
  );
}
