"use client";

import { useMemo, useState } from "react";
import { VideoBottomSheet, type VideoSheetInfo } from "@/components/VideoBottomSheet";

type ItemVideo = {
  id: string;
  vimeoId: string;
  vimeoHash: string | null;
  titulo: string;
  descricao: string | null;
};

export function VideosClient({
  doTreinoDeHoje,
  catalogo,
  eDeAluno,
}: {
  doTreinoDeHoje: ItemVideo[];
  catalogo: ItemVideo[];
  eDeAluno: boolean;
}) {
  const [busca, setBusca] = useState("");
  const [videoAberto, setVideoAberto] = useState<VideoSheetInfo | null>(null);

  const catalogoFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return catalogo;
    return catalogo.filter((v) => v.titulo.toLowerCase().includes(termo));
  }, [busca, catalogo]);

  const abrir = (v: ItemVideo) =>
    setVideoAberto({ vimeoId: v.vimeoId, vimeoHash: v.vimeoHash, titulo: v.titulo, legenda: v.descricao ?? undefined });

  return (
    <>
      {eDeAluno && (
        <>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar exercício"
            className="mt-6 w-full rounded-[2px] border border-line px-3 py-3 text-[14px] text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />

          {doTreinoDeHoje.length > 0 && (
            <section className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
                Do seu treino de hoje
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {doTreinoDeHoje.map((v) => (
                  <LinhaVideo key={v.id} video={v} destaque onClick={() => abrir(v)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          {eDeAluno ? "Biblioteca" : "Conteúdo da mentoria"}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {catalogoFiltrado.map((v) => (
            <LinhaVideo key={v.id} video={v} onClick={() => abrir(v)} />
          ))}
          {catalogoFiltrado.length === 0 && (
            <p className="text-[13px] text-ink-soft">Nenhum vídeo encontrado.</p>
          )}
        </div>
      </section>

      <VideoBottomSheet video={videoAberto} onFechar={() => setVideoAberto(null)} />
    </>
  );
}

function LinhaVideo({ video, destaque, onClick }: { video: ItemVideo; destaque?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[4px] border p-3 text-left"
      style={{
        borderColor: destaque ? "var(--color-accent-border)" : "var(--color-line)",
        background: "var(--color-card)",
      }}
    >
      <div
        className="flex h-[62px] w-[96px] shrink-0 items-center justify-center rounded-[2px]"
        style={{ background: "rgba(237,233,227,0.06)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-accent)">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-ink">{video.titulo}</p>
        {video.descricao && <p className="mt-0.5 truncate text-[12px] text-ink-soft">{video.descricao}</p>}
      </div>
    </button>
  );
}
