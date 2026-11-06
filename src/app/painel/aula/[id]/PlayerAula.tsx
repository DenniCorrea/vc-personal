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
    //
    // Os dois sao movidos por um RELOGIO NOSSO que PERGUNTA o tempo ao
    // player, e nao pelo evento `timeupdate` do Vimeo.
    //
    // Medido em 06/11/2026: durante 72s de reproducao continua o iframe
    // emitiu 275 eventos de progresso e NENHUM chegou ao nosso handler,
    // enquanto `pause` chegou normalmente na mesma sessao. Ou seja, o SDK
    // estava conectado e so o evento continuo se perdia. O efeito pratico
    // era grave e silencioso: a posicao so era salva quando a pessoa
    // pausava, e a conclusao automatica aos 95% nunca acontecia — quem
    // assistisse a aula inteira e fechasse a aba continuava com a aula
    // marcada como nao concluida.
    //
    // Evento continuo e a parte fragil da API (o navegador estrangula esse
    // tipo de evento quando a aba nao esta sendo desenhada); pergunta
    // direta sempre responde. E a mesma troca ja feita na captura do minuto
    // da duvida, pelo mesmo motivo.
    let relogio: ReturnType<typeof setInterval> | null = null;

    const gravarAgora = async (concluirSePassou: boolean) => {
      if (!vivo) return;
      try {
        const [segundos, duracao] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ]);
        if (!vivo || !Number.isFinite(segundos)) return;

        ultimoSalvoRef.current = Math.floor(segundos);
        void salvarPosicao(aulaId, Math.floor(segundos)).catch(() => {});

        if (
          concluirSePassou &&
          !concluiuRef.current &&
          duracao > 0 &&
          segundos >= duracao * PERCENTUAL_CONCLUSAO
        ) {
          concluiuRef.current = true;
          void marcarConcluida(aulaId, true).catch(() => {});
        }
      } catch {
        // Player sumiu ou nao respondeu: a proxima batida tenta de novo.
      }
    };

    const ligarRelogio = () => {
      if (relogio) return;
      relogio = setInterval(() => void gravarAgora(true), INTERVALO_SALVAR_MS);
    };
    const desligarRelogio = () => {
      if (relogio) clearInterval(relogio);
      relogio = null;
    };

    const aoDarPlay = () => {
      if (vivo) ligarRelogio();
    };

    // Parou: desliga o relogio e grava uma ultima vez. O `ended` tambem
    // passa por aqui com `concluir = true`, que e o caso de quem assistiu
    // ate o fim sem nunca pausar.
    const aoParar = () => {
      if (!vivo) return;
      desligarRelogio();
      void gravarAgora(true);
    };

    player.on("play", aoDarPlay);
    player.on("pause", aoParar);
    player.on("ended", aoParar);

    // Se a aula ja estiver tocando quando o efeito monta (remontagem do
    // React no meio do video), o `play` ja passou e nao vai disparar de novo.
    void player
      .getPaused()
      .then((pausado) => {
        if (vivo && !pausado) ligarRelogio();
      })
      .catch(() => {});

    // Fechar a aba conta como sair. Nao da pra esperar resposta aqui, entao
    // manda o ultimo tempo que ja esta em memoria.
    const aoSair = () => {
      void salvarPosicao(aulaId, ultimoSalvoRef.current).catch(() => {});
    };
    window.addEventListener("pagehide", aoSair);

    return () => {
      vivo = false;
      desligarRelogio();
      desconectarPlayer(aulaId);
      window.removeEventListener("pagehide", aoSair);
      // `off` e nao `destroy()`: o iframe pertence ao React. Destruir aqui
      // arrancaria da arvore um elemento que o React ainda gerencia — que e
      // justamente a disputa que causou o defeito original.
      player.off("play", aoDarPlay);
      player.off("pause", aoParar);
      player.off("ended", aoParar);
    };
    // `posicaoInicial` NAO entra aqui de proposito: ela e o valor INICIAL, e
    // so e lida uma vez na retomada. Como ela muda a cada posicao salva,
    // inclui-la remontaria o player no meio do video a cada gravacao.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

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
