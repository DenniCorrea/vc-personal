import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarPlanoConsultoria } from "../../actions";

export default async function PaginaPlanoConsultoria({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const plano =
    id === "novo"
      ? null
      : await prisma.planoConsultoria.findUnique({ where: { id } });

  if (id !== "novo" && !plano) notFound();

  const salvar = salvarPlanoConsultoria.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {plano ? "Editar plano de consultoria" : "Novo plano de consultoria"}
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
          Descrição
          <textarea
            name="descricao"
            defaultValue={plano?.descricao}
            required
            rows={4}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Preço mensal (R$)
          <input
            name="precoMensal"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plano ? Number(plano.precoMensal) : undefined}
            required
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
