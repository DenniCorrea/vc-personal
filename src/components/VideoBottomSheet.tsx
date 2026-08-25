"use client";

import { useEffect, useRef, useState } from "react";

export type VideoSheetInfo = {
  vimeoId: string;
  vimeoHash?: string | null;
  titulo: string;
  legenda?: string; // ex: "2:14 · peito · cadência 3-1-1"
};

// Bottom sheet global de video (handoff, tela 16 "Acesso rapido ao video").
// Fica montado sobre a tela atual — a tela de treino continua viva atras
// (cronometro/series nao se perdem) porque isso e so um overlay visual, nao
// uma troca de rota.
export function VideoBottomSheet({ video, onFechar }: { video: VideoSheetInfo | null; onFechar: () => void }) {
  const [arrastoY, setArrastoY] = useState(0);
  const arrastandoRef = useRef<{ inicioY: number; ativo: boolean }>({ inicioY: 0, ativo: false });

  useEffect(() => {
    if (!video) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [video, onFechar]);

  if (!video) return null;

  const params = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0", badge: "0" });
  if (video.vimeoHash) params.set("h", video.vimeoHash);
  const src = `https://player.vimeo.com/video/${video.vimeoId}?${params.toString()}`;

  const aoTocarInicio = (e: React.TouchEvent) => {
    arrastandoRef.current = { inicioY: e.touches[0].clientY, ativo: true };
  };
  const aoTocarMover = (e: React.TouchEvent) => {
    if (!arrastandoRef.current.ativo) return;
    const delta = e.touches[0].clientY - arrastandoRef.current.inicioY;
    if (delta > 0) setArrastoY(delta);
  };
  const aoTocarFim = () => {
    if (arrastoY > 80) onFechar();
    setArrastoY(0);
    arrastandoRef.current.ativo = false;
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8,7,6,0.72)" }}
        onClick={onFechar}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-[16px] border-t border-line lg:top-1/2 lg:bottom-auto lg:max-w-[720px] lg:-translate-y-1/2 lg:rounded-[16px] lg:border"
        style={{
          background: "var(--color-panel)",
          transform: arrastoY ? `translateY(${arrastoY}px)` : undefined,
          transition: arrastoY ? "none" : "transform 220ms ease-out",
        }}
        onTouchStart={aoTocarInicio}
        onTouchMove={aoTocarMover}
        onTouchEnd={aoTocarFim}
      >
        <div className="flex justify-center pt-2.5 pb-1 lg:hidden">
          <div className="h-1 w-11 rounded-full" style={{ background: "rgba(237,233,227,0.25)" }} />
        </div>

        <div className="aspect-video w-full overflow-hidden bg-black">
          <iframe
            src={src}
            title={video.titulo}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-ink">{video.titulo}</p>
            {video.legenda && <p className="mt-0.5 text-[12px] text-ink-soft">{video.legenda}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2.5 p-5 pt-4">
          <button
            type="button"
            className="flex-1 rounded-[2px] border border-line py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent-border"
          >
            Salvar nos meus vídeos
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-[2px] bg-accent py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
          >
            Voltar ao treino
          </button>
        </div>
      </div>
    </div>
  );
}
