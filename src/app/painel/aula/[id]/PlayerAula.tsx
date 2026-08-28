"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { salvarPosicao, marcarConcluida } from "../actions";

// Player da aula com retomada de posicao e conclusao automatica.
//
// Por que o SDK do Vimeo e nao so um <iframe>: o iframe simples nao deixa
// nem LER o tempo corrente nem MANDAR o video pular pra um ponto. Sem isso,
// "continue de onde parou" (handoff, secao Interacoes) nao existe — era o
// que faltava pra isso deixar de ser uma area de video e virar uma area de
// membros de verdade.
//
// Tres comportamentos:
// 1. Ao carregar, pula pra ultima posicao salva (se houver e se nao estiver
//    quase no fim — retomar em 99% so faria a pessoa ver os creditos).
// 2. Salva a posicao a cada 15s de reproducao, e tambem ao pausar/sair.
//    15s equilibra: perder no maximo 15s de progresso vs. nao martelar o
//    servidor a cada segundo.
// 3. Marca como concluida sozinho ao passar de 95% (regra do handoff) —
//    ninguem assiste os creditos, e obrigar o clique manual faz o progresso
//    do mentorado parecer pior do que e.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const ultimoSalvoRef = useRef(posicaoInicial);
  const concluiuRef = useRef(jaConcluida);
  const [retomou, setRetomou] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const player = new Player(container, {
      id: Number(vimeoId),
      ...(vimeoHash ? { h: vimeoHash } : {}),
      // Mesma limpeza de marca do wrapper simples (handoff).
      dnt: true,
      title: false,
      byline: false,
      portrait: false,
      responsive: true,
    });

    let vivo = true;

    // 1. Retomada
    player
      .getDuration()
      .then((duracao) => {
        if (!vivo) return;
        const quaseNoFim = posicaoInicial >= duracao * PERCENTUAL_CONCLUSAO;
        if (posicaoInicial > 5 && !quaseNoFim) {
          return player.setCurrentTime(posicaoInicial).then(() => setRetomou(true));
        }
      })
      .catch(() => {
        // Video privado/removido, rede caida: nao quebra a tela — a pessoa
        // simplesmente comeca do zero.
      });

    // 2 e 3. Progresso
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

    // Fechar a aba conta como sair: salva o ultimo tempo conhecido. Nao da
    // pra esperar resposta aqui (a aba esta indo embora), entao usamos o que
    // ja esta em memoria.
    const aoSair = () => {
      void salvarPosicao(aulaId, ultimoSalvoRef.current).catch(() => {});
    };
    window.addEventListener("pagehide", aoSair);

    return () => {
      vivo = false;
      window.removeEventListener("pagehide", aoSair);
      void player.destroy().catch(() => {});
    };
  }, [aulaId, vimeoId, vimeoHash, posicaoInicial]);

  return (
    <div>
      <div ref={containerRef} className="aspect-video w-full overflow-hidden rounded-[4px] bg-black" title={titulo} />
      {retomou && (
        <p className="mt-2 text-[12px] text-ink-faint">
          Retomamos de onde você parou.
        </p>
      )}
    </div>
  );
}
