import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarVideo } from "../actions";

export default async function PaginaVideo({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const video = id === "novo" ? null : await prisma.video.findUnique({ where: { id } });
  if (id !== "novo" && !video) notFound();

  const salvar = salvarVideo.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {video ? "Editar vídeo" : "Novo vídeo"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Produto
          <select
            name="produto"
            defaultValue={video?.produto ?? "ALUNO"}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="ALUNO">Aluno (vídeo de exercício)</option>
            <option value="MENTORIA">Mentoria</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Título
          <input
            name="titulo"
            defaultValue={video?.titulo}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Descrição (opcional)
          <textarea
            name="descricao"
            defaultValue={video?.descricao ?? ""}
            rows={3}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          ID do vídeo no Vimeo
          <input
            name="vimeoId"
            defaultValue={video?.vimeoId}
            required
            placeholder="ex: 824804225"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
          <span className="text-xs font-normal text-ink-soft">
            É o número que aparece na URL do vídeo no Vimeo (vimeo.com/<b>824804225</b>).
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Hash do link privado (se o vídeo não for público)
          <input
            name="vimeoHash"
            defaultValue={video?.vimeoHash ?? ""}
            placeholder="ex: a1b2c3d4e5"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
          <span className="text-xs font-normal text-ink-soft">
            No Vimeo: Configurações do vídeo → Privacidade → &quot;Ocultar de vimeo.com&quot; +
            copiar o link privado. É a parte depois de &quot;?h=&quot; nesse link.
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
