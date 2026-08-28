import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { salvarAula } from "../../actions";

export default async function PaginaAulaAdmin({ params, searchParams }: PageProps<"/painel/admin/trilha/aula/[id]">) {
  await exigirPapel("ADMIN");
  const { id } = await params;
  const { modulo: moduloDaQuery } = await searchParams;

  const [aula, modulos, videos, planos] = await Promise.all([
    id === "novo"
      ? null
      : prisma.aula.findUnique({ where: { id }, include: { planosVisiveis: { select: { id: true } } } }),
    prisma.modulo.findMany({ orderBy: { ordem: "asc" }, select: { id: true, titulo: true } }),
    // So video de MENTORIA: a trilha B2B nunca mostra video de exercicio
    // do app de aluno, e ver os dois juntos so daria chance de errar.
    prisma.video.findMany({ where: { produto: "MENTORIA", ativo: true }, orderBy: { criadoEm: "desc" } }),
    prisma.plano.findMany({ where: { produto: "MENTORIA", ativo: true }, orderBy: { preco: "asc" } }),
  ]);

  if (id !== "novo" && !aula) notFound();
  if (modulos.length === 0) {
    return (
      <main className="max-w-xl">
        <h1 className="font-display text-[26px] text-ink">Crie um módulo primeiro</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Uma aula precisa pertencer a um módulo.</p>
        <Link href="/painel/admin/trilha/modulo/novo" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Novo módulo
        </Link>
      </main>
    );
  }

  const moduloPadrao =
    aula?.moduloId ?? (typeof moduloDaQuery === "string" ? moduloDaQuery : undefined) ?? modulos[0].id;
  const planosMarcados = new Set(aula?.planosVisiveis.map((p) => p.id) ?? []);
  const salvar = salvarAula.bind(null, id);

  return (
    <main className="max-w-2xl">
      <Link href="/painel/admin/trilha" className="text-[13px] text-ink-soft hover:text-ink">
        ← Trilha de conteúdo
      </Link>
      <h1 className="font-display mt-2 text-[26px] text-ink lg:text-[32px]">
        {aula ? "Editar aula" : "Nova aula"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Módulo
            <select
              name="moduloId"
              defaultValue={moduloPadrao}
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            >
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titulo}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Vídeo
            <select
              name="videoId"
              defaultValue={aula?.videoId ?? ""}
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            >
              <option value="">— Sem vídeo —</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.titulo}
                </option>
              ))}
            </select>
            <span className="text-[12px] font-normal text-ink-soft">
              Cadastre antes em{" "}
              <Link href="/painel/admin/videos" className="text-accent">
                Vídeos
              </Link>
              .
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Título da aula
          <input
            name="titulo"
            defaultValue={aula?.titulo}
            required
            placeholder="ex: Script de fechamento"
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Descrição
          <textarea
            name="descricao"
            defaultValue={aula?.descricao ?? ""}
            rows={4}
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
          <span className="text-[12px] font-normal text-ink-soft">
            Aparece no bloco &quot;Nesta aula&quot;, abaixo do vídeo.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Material de apoio (link do PDF, opcional)
          <input
            name="materialUrl"
            type="url"
            defaultValue={aula?.materialUrl ?? ""}
            placeholder="https://..."
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Publicação
            <select
              name="status"
              defaultValue={aula?.status ?? "RASCUNHO"}
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            >
              <option value="RASCUNHO">Rascunho (só você vê)</option>
              <option value="PUBLICADA">Publicada</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Prazo de acesso (dias)
            <input
              name="prazoAcessoDias"
              type="number"
              min={1}
              defaultValue={aula?.prazoAcessoDias ?? ""}
              placeholder="deixe vazio = sem prazo"
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
            <span className="text-[12px] font-normal text-ink-soft">
              O mentorado vê o selo &quot;Acesso por mais N dias&quot;. Conta a partir da
              publicação.
            </span>
          </label>
        </div>

        <fieldset className="rounded-[4px] border border-line bg-card p-4">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Quem vê esta aula
          </legend>
          <div className="mt-2 flex flex-col gap-2.5">
            {planos.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-[14px] text-ink">
                <input
                  type="checkbox"
                  name="planosVisiveis"
                  value={p.id}
                  defaultChecked={planosMarcados.has(p.id)}
                />
                {p.nome}
              </label>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-faint">
            Sem nenhum plano marcado, a aula não aparece para ninguém — mesmo publicada.
          </p>
        </fieldset>

        <button
          type="submit"
          className="self-start rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
        >
          Salvar aula
        </button>
      </form>
    </main>
  );
}
