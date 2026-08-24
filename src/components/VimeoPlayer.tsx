// So um wrapper fino do iframe do player do Vimeo. A protecao de verdade
// acontece ANTES desse componente ser renderizado — quem chama isso (ex:
// src/app/painel/videos/page.tsx) ja checou que o usuario tem assinatura
// ativa no produto certo. Esse componente nao sabe nada sobre permissao.
export function VimeoPlayer({ vimeoId, vimeoHash, titulo }: { vimeoId: string; vimeoHash?: string | null; titulo: string }) {
  const src = `https://player.vimeo.com/video/${vimeoId}${vimeoHash ? `?h=${vimeoHash}` : ""}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={src}
        title={titulo}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
