import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarPlanoAluno } from "../../actions";

const TIPOS_ATENDIMENTO = [
  { valor: "VIDEO", rotulo: "Vídeo" },
  { valor: "PRESENCIAL", rotulo: "Presencial" },
  { valor: "DISTANCIA", rotulo: "À distância" },
] as const;

export default async function PaginaPlanoAluno({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const plano =
    id === "novo" ? null : await prisma.plano.findFirst({ where: { id, produto: "ALUNO" } });

  if (id !== "novo" && !plano) notFound();

  const salvar = salvarPlanoAluno.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin · Produto Aluno
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {plano ? "Editar plano de aluno" : "Novo plano de aluno"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Nome
          <input
            name="nome"
            defaultValue={plano?.nome}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Sessões por semana
          <input
            name="frequenciaSemanal"
            type="number"
            min={1}
            max={7}
            defaultValue={plano?.frequenciaSemanal ?? 3}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
          <span className="text-xs font-normal text-ink-soft">
            Também define o limite de agendamentos por semana (Fase 4).
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Preço mensal (R$)
          <input
            name="preco"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plano ? Number(plano.preco) : undefined}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">Tipos de atendimento</legend>
          {TIPOS_ATENDIMENTO.map((tipo) => (
            <label key={tipo.valor} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="tiposAtendimento"
                value={tipo.valor}
                defaultChecked={plano?.tiposAtendimento.includes(tipo.valor) ?? false}
              />
              {tipo.rotulo}
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="incluiNutricao" defaultChecked={plano?.incluiNutricao} />
          Inclui acompanhamento nutricional
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Benefícios (um por linha)
          <textarea
            name="beneficios"
            rows={4}
            defaultValue={plano?.beneficios.join("\n")}
            placeholder="Avaliação física mensal&#10;Grupo exclusivo no WhatsApp"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          Salvar
        </button>
      </form>
    </main>
  );
}
