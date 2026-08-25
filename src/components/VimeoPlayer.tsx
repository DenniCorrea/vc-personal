// So um wrapper fino do iframe do player do Vimeo. A protecao de verdade
// acontece ANTES desse componente ser renderizado — quem chama isso (ex:
// src/app/painel/videos/page.tsx) ja checou que o usuario tem assinatura
// ativa no produto certo. Esse componente nao sabe nada sobre permissao.
export function VimeoPlayer({ vimeoId, vimeoHash, titulo }: { vimeoId: string; vimeoHash?: string | null; titulo: string }) {
  // dnt=1 + title/byline/portrait/badge=0 tira toda marca do Vimeo da tela —
  // pedido explicito do handoff (Metodo Lider, secao "Vimeo").
  const params = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0", badge: "0" });
  if (vimeoHash) params.set("h", vimeoHash);
  const src = `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={src}
        title={titulo}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"
      />
    </div>
  );
}
