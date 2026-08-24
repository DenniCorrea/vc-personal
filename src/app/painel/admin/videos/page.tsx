import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoVideo } from "./actions";

export default async function PaginaAdminVideos() {
  await exigirPapel("ADMIN");

  const videos = await prisma.video.findMany({ orderBy: { criadoEm: "desc" } });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Vídeos</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Faça o upload do vídeo direto no site do Vimeo primeiro, depois cole o ID (e o link
        privado, se o vídeo não for público) aqui.
      </p>

      <Link
        href="/painel/admin/videos/novo"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        + Novo vídeo
      </Link>

      <ul className="mt-6 flex flex-col gap-2">
        {videos.map((video) => (
          <li
            key={video.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {video.titulo}{" "}
                {!video.ativo && <span className="text-xs font-normal text-ink-soft">(inativo)</span>}
              </p>
              <p className="text-sm text-ink-soft">
                {video.produto} · vimeo.com/{video.vimeoId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/painel/admin/videos/${video.id}`} className="text-sm font-medium text-accent">
                Editar
              </Link>
              <form action={alternarAtivoVideo.bind(null, video.id, !video.ativo)}>
                <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                  {video.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
            </div>
          </li>
        ))}
        {videos.length === 0 && <p className="text-sm text-ink-soft">Nenhum vídeo cadastrado ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
