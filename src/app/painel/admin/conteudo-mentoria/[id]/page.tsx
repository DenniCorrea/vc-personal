import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { paraInputDate } from "@/lib/data";
import { salvarConteudo } from "../actions";

const PILARES = [
  { valor: "POSICIONAMENTO", rotulo: "Posicionamento" },
  { valor: "ABORDAGEM", rotulo: "Abordagem" },
  { valor: "MAPEAMENTO", rotulo: "Mapeamento" },
  { valor: "VENDAS", rotulo: "Vendas" },
  { valor: "FIDELIZACAO", rotulo: "Fidelização" },
] as const;

export default async function PaginaConteudoMentoria({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const [conteudo, videos] = await Promise.all([
    id === "novo" ? null : prisma.conteudoConsultoria.findUnique({ where: { id } }),
    prisma.video.findMany({ where: { produto: "MENTORIA", ativo: true }, orderBy: { titulo: "asc" } }),
  ]);
  if (id !== "novo" && !conteudo) notFound();

  const salvar = salvarConteudo.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {conteudo ? "Editar conteúdo" : "Novo conteúdo"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Pilar
          <select
            name="pilar"
            defaultValue={conteudo?.pilar ?? "POSICIONAMENTO"}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            {PILARES.map((pilar) => (
              <option key={pilar.valor} value={pilar.valor}>
                {pilar.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Tipo
          <select
            name="tipo"
            defaultValue={conteudo?.tipo ?? "PADRAO"}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="PADRAO">Padrão (sempre disponível)</option>
            <option value="SEMANAL">Semanal (o vídeo da semana)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Título
          <input
            name="titulo"
            defaultValue={conteudo?.titulo}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Descrição
          <textarea
            name="descricao"
            defaultValue={conteudo?.descricao ?? ""}
            rows={3}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Vídeo
          <select
            name="videoId"
            defaultValue={conteudo?.videoId ?? ""}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="">— Sem vídeo —</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.titulo}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-ink-soft">
            Só aparecem vídeos cadastrados como produto &quot;Mentoria&quot; (Fase 6).
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Data de publicação
          <input
            name="publicadoEm"
            type="date"
            defaultValue={conteudo ? paraInputDate(conteudo.publicadoEm) : paraInputDate(new Date())}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
          <span className="text-xs font-normal text-ink-soft">
            Uma data futura fica escondida do mentorado até esse dia chegar.
          </span>
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
