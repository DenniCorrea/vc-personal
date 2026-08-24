"use client";

import { useEffect, useRef } from "react";
import { LoginForm } from "./LoginForm";

// Rolagem com parallax (handoff Metodo Lider, tela 1a). As 3 camadas de
// fundo (degrade, marca d'agua "METODO", foto do Victor) ficam fixas na
// viewport e recebem um translateY proporcional ao scroll — cada uma com um
// fator diferente, o que cria a sensacao de profundidade. O conteudo (texto,
// citacao, card de login) e normal-flow: rola junto com a pagina, sem truque
// nenhum.
export function LoginHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = containerRef.current;
    if (prefersReduzido || !container) return;

    let raf = 0;
    const aoRolar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = container.scrollTop;
        if (layer1Ref.current) layer1Ref.current.style.transform = `translateY(${Math.round(y * 0.1)}px)`;
        if (layer2Ref.current) layer2Ref.current.style.transform = `translateY(${Math.round(y * 0.28)}px)`;
        if (layer3Ref.current) layer3Ref.current.style.transform = `translateY(${Math.round(y * 0.45)}px)`;
      });
    };

    container.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      container.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-dvh overflow-y-scroll bg-paper">
      {/* Camadas de fundo — fixas na viewport, translateY via JS conforme o scroll */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          ref={layer1Ref}
          className="absolute inset-0 will-change-transform"
          style={{
            background: "radial-gradient(120% 90% at 72% 18%, #2A2622 0%, #14120F 55%, #0B0A09 100%)",
          }}
        />
        <div
          ref={layer2Ref}
          className="absolute inset-0 flex items-start justify-end overflow-hidden pt-8 pr-4 will-change-transform"
        >
          <span
            className="font-display select-none leading-none"
            style={{ fontSize: "clamp(90px, 24vw, 230px)", color: "rgba(201,168,124,0.07)" }}
          >
            MÉTODO
          </span>
        </div>
        <div
          ref={layer3Ref}
          className="absolute right-0 top-0 hidden h-full w-[520px] will-change-transform md:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/victor-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: "50% 12%",
              maskImage: "linear-gradient(to bottom, #000 78%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 78%, transparent)",
              filter: "contrast(1.05) saturate(0.92)",
            }}
          />
        </div>
      </div>

      {/* Conteudo — normal-flow, velocidade normal de scroll */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 md:px-16 md:pt-[150px]">
        {/* Mobile: foto no topo, normal-flow (handoff: "mesma sequencia em
            coluna; foto no topo com mascara"). No desktop a foto já aparece
            como camada de fundo (layer3 acima), entao aqui e md:hidden. */}
        <div className="-mx-6 mb-8 h-[280px] md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/victor-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: "50% 12%",
              maskImage: "linear-gradient(to bottom, #000 70%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent)",
              filter: "contrast(1.05) saturate(0.92)",
            }}
          />
        </div>

        <div className="max-w-[480px] pt-8 md:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Consultoria de alta performance
          </p>
          <h1 className="font-display mt-4 text-[42px] leading-[1.05] tracking-[-0.02em] text-ink md:text-[66px]">
            Constância
            <br />
            vale mais que
            <br />
            <span className="italic text-accent">motivação.</span>
          </h1>
          <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-ink-soft">
            Mentalidade, método e acompanhamento próximo. Continue rolando para acessar sua conta.
          </p>
          <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
            <span
              className="h-[34px] w-px"
              style={{ background: "linear-gradient(to bottom, var(--color-accent), transparent)" }}
            />
            Role para entrar
          </div>
        </div>

        <div className="mt-[420px] max-w-[560px] md:mt-[520px]">
          <p className="font-display text-[26px] italic leading-[1.35] text-ink md:text-[34px]">
            &ldquo;Disciplina é o que sustenta o resultado depois que a vontade passa.&rdquo;
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
            Victor Carvalho
          </p>
        </div>

        <div className="mt-[280px] flex justify-center md:mt-[340px]">
          <div
            className="w-full max-w-[432px] rounded-[6px] border border-line px-9 py-11 backdrop-blur-md"
            style={{ background: "rgba(20,18,15,0.86)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Método Líder</p>
            <h2 className="font-display mt-2 text-[32px] text-ink">Acessar minha conta</h2>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
