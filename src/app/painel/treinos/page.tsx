import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export default async function PaginaTreinos() {
  const session = await exigirPapel("ALUNO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
  });

  if (!assinatura) {
    return (
      <main className="px-6 pt-13 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Treino</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Você ainda não tem acesso</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Assine um plano pra ver sua ficha de treino.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const treinos = await prisma.treino.findMany({
    where: { usuarioId: session.user.id, ativo: true },
    include: { _count: { select: { exercicios: true } } },
    orderBy: { criadoEm: "asc" },
  });

  return (
    <main className="px-6 pt-13 pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Treino</p>
      <h1 className="font-display mt-1 text-[28px] text-ink">Sua ficha</h1>

      <div className="mt-6 flex flex-col gap-3">
        {treinos.map((treino) => (
          <Link
            key={treino.id}
            href={`/painel/treinos/${treino.id}`}
            className="rounded-[4px] border border-line bg-card p-4 hover:border-accent-border"
          >
            <p className="text-[17px] font-semibold text-ink">{treino.nome}</p>
            <p className="mt-1 text-[13px] text-ink-soft">{treino._count.exercicios} exercícios</p>
          </Link>
        ))}
        {treinos.length === 0 && (
          <p className="text-[14px] text-ink-soft">
            Você ainda não tem nenhuma ficha de treino — o Victor monta a sua em breve.
          </p>
        )}
      </div>
    </main>
  );
}
