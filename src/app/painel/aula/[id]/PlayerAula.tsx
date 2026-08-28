"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { salvarPosicao, marcarConcluida } from "../actions";
import { conectarPlayer, desconectarPlayer } from "./tempoDoPlayer";

// Player da aula com retomada de posicao, conclusao automatica e captura do
// minuto pro formulario de duvida.
//
// DECISAO IMPORTANTE: o <iframe> e renderizado pelo REACT e o SDK apenas se
// acopla nele (`new Player(iframeElement)`), em vez de deixar o SDK criar o
// proprio iframe dentro de uma <div> (`new Player(div, { id })`).
//
// Motivo: com o SDK criando o iframe, ele mexe no DOM por baixo do React.
// Na remontagem do efeito (que o React faz de proposito em desenvolvimento),
// o `destroy()` assincrono do primeiro player e a criacao do segundo se
// atropelam — sobra um iframe na tela tocando normalmente, mas ligado a uma
// instancia ja destruida. Resultado: o video roda e NENHUM evento chega.
// Foi exatamente isso que aconteceu: a posicao nunca era salva, e o defeito
// nao aparecia na tela (o video tocava lindamente).
//
// Com o iframe sob controle do React, o elemento e estavel entre montagens e
// o acoplamento do SDK e so uma assinatura de eventos — sem disputa de DOM.
const INTERVALO_SALVAR_MS = 15_000;
const PERCENTUAL_CONCLUSAO = 0.95;

export function PlayerAula({
  aulaId,
  vimeoId,
  vimeoHash,
  titulo,
  posicaoInicial,
  jaConcluida,
}: {
  aulaId: string;
  vimeoId: string;
  vimeoHash: string | null;
  titulo: string;
  posicaoInicial: number;
  jaConcluida: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ultimoSalvoRef = useRef(posicaoInicial);
  const concluiuRef = useRef(jaConcluida);
  const [retomou, setRetomou] = useState(false);

  // dnt=1 + title/byline/portrait/badge=0 tira toda marca do Vimeo (handoff).
  const params = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0", badge: "0" });
  if (vimeoHash) params.set("h", vimeoHash);
  const src = `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const player = new Player(iframe);
    let vivo = true;

    // Liga o player ao formulario de duvida: ele pergunta o tempo no
    // clique e pausa o video ao abrir — ninguem formula uma pergunta com a
    // aula correndo no ouvido.
    conectarPlayer({
      aulaId,
      lerTempo: () => player.getCurrentTime(),
      pausar: () => {
        void player.pause().catch(() => {});
      },
    });

    // 1. Retomada — pula pra ultima posicao salva, a nao ser que ela ja
    // esteja quase no fim (retomar em 99% so mostraria os creditos).
    player
      .getDuration()
      .then((duracao) => {
        if (!vivo) return;
        const quaseNoFim = posicaoInicial >= duracao * PERCENTUAL_CONCLUSAO;
        if (posicaoInicial > 5 && !quaseNoFim) {
          return player.setCurrentTime(posicaoInicial).then(() => {
            if (vivo) setRetomou(true);
          });
        }
      })
      .catch(() => {
        // Video privado, removido ou rede caida: a pessoa so comeca do zero.
      });

    // 2. Progresso e 3. conclusao automatica
    let ultimoEnvio = Date.now();
    const aoTocar = ({ seconds, duration }: { seconds: number; duration: number }) => {
      if (!vivo) return;

      if (!concluiuRef.current && duration > 0 && seconds >= duration * PERCENTUAL_CONCLUSAO) {
        concluiuRef.current = true;
        void marcarConcluida(aulaId, true).catch(() => {});
        return;
      }

      if (Date.now() - ultimoEnvio >= INTERVALO_SALVAR_MS) {
        ultimoEnvio = Date.now();
        ultimoSalvoRef.current = Math.floor(seconds);
        void salvarPosicao(aulaId, Math.floor(seconds)).catch(() => {});
      }
    };

    const aoParar = ({ seconds }: { seconds: number }) => {
      if (!vivo) return;
      ultimoSalvoRef.current = Math.floor(seconds);
      void salvarPosicao(aulaId, Math.floor(seconds)).catch(() => {});
    };

    player.on("timeupdate", aoTocar);
    player.on("pause", aoParar);
    player.on("ended", aoParar);

    // Fechar a aba conta como sair. Nao da pra esperar resposta aqui, entao
    // manda o ultimo tempo que ja esta em memoria.
    const aoSair = () => {
      void salvarPosicao(aulaId, ultimoSalvoRef.current).catch(() => {});
    };
    window.addEventListener("pagehide", aoSair);

    return () => {
      vivo = false;
      desconectarPlayer(aulaId);
      window.removeEventListener("pagehide", aoSair);
      // `off` e nao `destroy()`: o iframe pertence ao React. Destruir aqui
      // arrancaria da arvore um elemento que o React ainda gerencia — que e
      // justamente a disputa que causou o defeito original.
      player.off("timeupdate", aoTocar);
      player.off("pause", aoParar);
      player.off("ended", aoParar);
    };
  }, [aulaId, posicaoInicial]);

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-[4px] bg-black">
        <iframe
          ref={iframeRef}
          src={src}
          title={titulo}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {retomou && <p className="mt-2 text-[12px] text-ink-faint">Retomamos de onde você parou.</p>}
    </div>
  );
}
