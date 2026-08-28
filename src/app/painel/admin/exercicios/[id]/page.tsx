import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarExercicio } from "../actions";

export default async function PaginaExercicio({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const [exercicio, videos] = await Promise.all([
    id === "novo" ? null : prisma.exercicio.findUnique({ where: { id } }),
    prisma.video.findMany({ where: { produto: "ALUNO", ativo: true }, orderBy: { titulo: "asc" } }),
  ]);
  if (id !== "novo" && !exercicio) notFound();

  const salvar = salvarExercicio.bind(null, id);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      {/* Link de volta pro pai. Sem ele a unica saida e a seta do
          navegador, que no celular joga a pessoa pra primeira tela da
          navegacao — ela perde o lugar e precisa descer 2-3 niveis de novo
          pra continuar editando (problema relatado em 28/08/2026). */}
      <Link href="/painel/admin/exercicios" className="text-[13px] text-ink-soft hover:text-ink">
        ← Exercícios
      </Link>
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {exercicio ? "Editar exercício" : "Novo exercício"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Nome
          <input
            name="nome"
            defaultValue={exercicio?.nome}
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Descrição
          <textarea
            name="descricao"
            defaultValue={exercicio?.descricao ?? ""}
            rows={2}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Instruções
          <textarea
            name="instrucoes"
            defaultValue={exercicio?.instrucoes ?? ""}
            rows={3}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Cuidados
          <textarea
            name="cuidados"
            defaultValue={exercicio?.cuidados ?? ""}
            rows={2}
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Grupo muscular principal
          <input
            name="grupoMuscularPrincipal"
            defaultValue={exercicio?.grupoMuscularPrincipal ?? ""}
            placeholder="ex: Peitoral"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Grupos musculares secundários
          <input
            name="gruposMuscularesSecundarios"
            defaultValue={exercicio?.gruposMuscularesSecundarios.join(", ") ?? ""}
            placeholder="ex: Tríceps, Deltoide anterior (separados por vírgula)"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Imagem anatômica
          {exercicio?.imagemAnatomica && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={exercicio.imagemAnatomica} alt="" className="h-24 w-16 rounded object-cover" />
          )}
          <input type="file" name="imagemAnatomica" accept="image/*" className="text-sm text-ink-soft" />
          <span className="text-xs font-normal text-ink-soft">
            A mesma imagem padrão que aparece nos aparelhos, mostrando o grupo muscular trabalhado.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Vídeo padrão
          <select
            name="videoId"
            defaultValue={exercicio?.videoId ?? ""}
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
            Só aparecem vídeos cadastrados como produto &quot;Aluno&quot; (Fase 6).
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
