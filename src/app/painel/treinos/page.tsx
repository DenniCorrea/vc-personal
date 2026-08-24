import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { VimeoPlayer } from "@/components/VimeoPlayer";

export default async function PaginaTreinos() {
  const session = await exigirPapel("ALUNO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
  });

  if (!assinatura) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          Treinos
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
          Você ainda não tem acesso
        </h1>
        <p className="mt-2 text-ink-soft">Assine um plano pra ver sua ficha de treino.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-sm font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  // A checagem que garante que ninguem ve ficha de outro aluno esta aqui:
  // `usuarioId: session.user.id` — mesmo que alguem adivinhe o id de um
  // Treino de outra pessoa, essa query so retorna o que e dessa sessao.
  const treinos = await prisma.treino.findMany({
    where: { usuarioId: session.user.id, ativo: true },
    include: {
      exercicios: { include: { exercicio: { include: { video: true } } }, orderBy: { ordem: "asc" } },
    },
    orderBy: { criadoEm: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Treinos
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Sua ficha</h1>

      <div className="mt-8 flex flex-col gap-10">
        {treinos.map((treino) => (
          <section key={treino.id}>
            <h2 className="font-display text-xl font-semibold text-ink">{treino.nome}</h2>
            <div className="mt-4 flex flex-col gap-6">
              {treino.exercicios.map((prescricao) => (
                <div key={prescricao.id} className="rounded-lg border border-line bg-paper-raised p-4">
                  <p className="font-medium text-ink">{prescricao.exercicio.nome}</p>
                  <p className="text-sm text-ink-soft">
                    {[
                      prescricao.series && `${prescricao.series} séries`,
                      prescricao.repeticoes && `${prescricao.repeticoes} repetições`,
                      prescricao.carga && `carga: ${prescricao.carga}`,
                      prescricao.descanso && `descanso: ${prescricao.descanso}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {prescricao.exercicio.descricao && (
                    <p className="mt-2 text-sm text-ink-soft">{prescricao.exercicio.descricao}</p>
                  )}
                  {prescricao.observacoes && (
                    <p className="mt-1 text-sm text-accent">{prescricao.observacoes}</p>
                  )}
                  {prescricao.exercicio.video && (
                    <div className="mt-3">
                      <VimeoPlayer
                        vimeoId={prescricao.exercicio.video.vimeoId}
                        vimeoHash={prescricao.exercicio.video.vimeoHash}
                        titulo={prescricao.exercicio.nome}
                      />
                    </div>
                  )}
                </div>
              ))}
              {treino.exercicios.length === 0 && (
                <p className="text-sm text-ink-soft">Nenhum exercício nessa ficha ainda.</p>
              )}
            </div>
          </section>
        ))}
        {treinos.length === 0 && (
          <p className="text-sm text-ink-soft">
            Você ainda não tem nenhuma ficha de treino — o Victor monta a sua em breve.
          </p>
        )}
      </div>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
