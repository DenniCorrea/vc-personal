import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { paraInputDate } from "@/lib/data";
import { salvarMensagem } from "../actions";

export default async function PaginaMensagem({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const mensagem = id === "novo" ? null : await prisma.mensagemMentalidade.findUnique({ where: { id } });
  if (id !== "novo" && !mensagem) notFound();

  const salvar = salvarMensagem.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {mensagem ? "Editar mensagem" : "Nova mensagem"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Texto
          <textarea
            name="texto"
            defaultValue={mensagem?.texto}
            required
            rows={4}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Frequência
          <select
            name="frequencia"
            defaultValue={mensagem?.frequencia ?? "DIARIA"}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="DIARIA">Diária</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Data de publicação
          <input
            name="publicadoEm"
            type="date"
            defaultValue={mensagem ? paraInputDate(mensagem.publicadoEm) : paraInputDate(new Date())}
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
