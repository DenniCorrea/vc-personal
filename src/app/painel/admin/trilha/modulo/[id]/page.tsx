import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarModulo } from "../../actions";

const PILARES = [
  { valor: "POSICIONAMENTO", rotulo: "Posicionamento" },
  { valor: "ABORDAGEM", rotulo: "Abordagem" },
  { valor: "MAPEAMENTO", rotulo: "Mapeamento" },
  { valor: "VENDAS", rotulo: "Vendas" },
  { valor: "FIDELIZACAO", rotulo: "Fidelização" },
] as const;

export default async function PaginaModuloAdmin({ params }: PageProps<"/painel/admin/trilha/modulo/[id]">) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const modulo = id === "novo" ? null : await prisma.modulo.findUnique({ where: { id } });
  if (id !== "novo" && !modulo) notFound();

  const salvar = salvarModulo.bind(null, id);

  return (
    <main className="max-w-xl">
      <Link href="/painel/admin/trilha" className="text-[13px] text-ink-soft hover:text-ink">
        ← Trilha de conteúdo
      </Link>
      <h1 className="font-display mt-2 text-[26px] text-ink lg:text-[32px]">
        {modulo ? "Editar módulo" : "Novo módulo"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Pilar
          <select
            name="pilar"
            defaultValue={modulo?.pilar ?? "POSICIONAMENTO"}
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          >
            {PILARES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
          <span className="text-[12px] font-normal text-ink-soft">
            Agrupa o módulo num dos cinco pilares da mentoria.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Título
          <input
            name="titulo"
            defaultValue={modulo?.titulo}
            required
            placeholder="ex: Definindo seu posicionamento"
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Descrição (opcional)
          <textarea
            name="descricao"
            defaultValue={modulo?.descricao ?? ""}
            rows={3}
            placeholder="Uma linha sobre o que o mentorado vai conseguir depois deste módulo."
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <button
          type="submit"
          className="mt-2 self-start rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
        >
          Salvar módulo
        </button>
      </form>
    </main>
  );
}
