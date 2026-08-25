import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { AnamneseForm } from "./AnamneseForm";

export default async function PaginaAnamnese() {
  const session = await exigirPapel("ALUNO");

  const anamnese = await prisma.anamnese.findUnique({ where: { usuarioId: session.user.id } });

  return (
    <main className="px-6 pt-cabecalho-aluno pb-10">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[2px] flex-1 rounded-full" style={{ background: "var(--color-accent)" }} />
        ))}
      </div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
        {anamnese ? "Atualizar respostas" : "Primeiro acesso"}
      </p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Onde você está hoje?</h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Essas respostas definem a sua primeira ficha. Leva menos de dois minutos.
      </p>

      <AnamneseForm
        valoresIniciais={
          anamnese
            ? {
                tempoTreino: anamnese.tempoTreino,
                diasDisponiveis: anamnese.diasDisponiveis,
                objetivo: anamnese.objetivo,
                lesoesRestricoes: anamnese.lesoesRestricoes,
              }
            : undefined
        }
      />
    </main>
  );
}
