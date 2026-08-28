"use client";

import { useEffect, useRef } from "react";
import { LoginForm } from "./LoginForm";

const PILARES = [
  { numero: "01", nome: "Posicionamento", descricao: "Definir para quem você fala e por que ele deveria te escolher." },
  { numero: "02", nome: "Vendas", descricao: "Transformar autoridade em proposta que fecha, sem parecer vendedor." },
  { numero: "03", nome: "Constância", descricao: "O que sustenta o ticket alto depois que a motivação inicial passa." },
];

// Rolagem com parallax (handoff_mentoria_b2b_metodo_lider, tela 5a). 4
// camadas de fundo fixas na viewport, cada uma com um fator de translateY
// diferente — cria a sensacao de profundidade conforme rola. O conteudo
// (texto, pilares, card de login) e normal-flow, rola na velocidade normal.
//
// Os fatores seguem RESPONSIVE.md (fundo 0.08, pilares 0.34, foto 0.56,
// conteudo 1.00). A camada "indice" do handoff (numeracao 01-03 que acende
// conforme rola) foi simplificada: em vez de uma 5a camada de parallax
// separada, os numeros ja vem junto de cada pilar mais abaixo na pagina —
// mesmo efeito de "indice guiando a leitura", um pouco mais simples de
// manter.
export function LoginHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerFundoRef = useRef<HTMLDivElement>(null);
  const layerPilaresRef = useRef<HTMLDivElement>(null);
  const layerFotoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const container = containerRef.current;
    if (prefersReduzido || saveData || !container) return;

    let raf = 0;
    const aoRolar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = container.scrollTop;
        // Amplitude reduzida a ~60% no mobile (RESPONSIVE.md).
        const escala = window.innerWidth < 768 ? 0.6 : 1;
        if (layerFundoRef.current) layerFundoRef.current.style.transform = `translateY(${Math.round(y * 0.08 * escala)}px)`;
        if (layerPilaresRef.current) layerPilaresRef.current.style.transform = `translateY(${Math.round(y * 0.34 * escala)}px)`;
        if (layerFotoRef.current) layerFotoRef.current.style.transform = `translateY(${Math.round(y * 0.56 * escala)}px)`;
      });
    };

    container.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      container.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-dvh overflow-y-scroll" style={{ background: "var(--color-hero)" }}>
      {/* Camadas de fundo — fixas na viewport, translateY via JS conforme o scroll */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          ref={layerFundoRef}
          className="absolute inset-0 will-change-transform"
          style={{
            background: "radial-gradient(115% 85% at 74% 16%, #2B2419 0%, #12100C 55%, #070605 100%)",
          }}
        />
        <div
          ref={layerPilaresRef}
          className="absolute inset-0 flex flex-col items-end justify-start gap-4 overflow-hidden pt-10 pr-4 will-change-transform md:gap-16 md:pt-16"
        >
          {["POSICIONAMENTO", "VENDAS", "CONSTÂNCIA"].map((palavra, i) => (
            <span
              key={palavra}
              className="font-display select-none leading-none"
              style={{
                fontSize: "clamp(56px, 17vw, 150px)",
                color: `rgba(203,163,92,${[0.055, 0.045, 0.035][i]})`,
              }}
            >
              {palavra}
            </span>
          ))}
        </div>
        <div
          ref={layerFotoRef}
          className="absolute right-0 top-0 hidden h-full w-[500px] will-change-transform md:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/victor-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: "50% 12%",
              maskImage: "linear-gradient(to bottom, #000 76%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 76%, transparent)",
              filter: "contrast(1.06) saturate(0.9)",
            }}
          />
        </div>
      </div>

      {/* Conteudo — normal-flow, velocidade normal de scroll */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 md:px-16 md:pt-[150px]">
        {/* Mobile: foto no topo, normal-flow. No desktop a foto ja aparece
            como camada de fundo (layerFoto acima), entao aqui e md:hidden. */}
        <div className="-mx-6 mb-8 h-[60dvh] max-h-[420px] md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/victor-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: "50% 12%",
              maskImage: "linear-gradient(to bottom, #000 70%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent)",
              filter: "contrast(1.06) saturate(0.9)",
            }}
          />
        </div>

        <div className="max-w-[520px] pt-8 md:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Mentoria para personal trainers
          </p>
          <h1
            className="font-display mt-4 leading-[1.05] tracking-[-0.02em] text-ink"
            style={{ fontSize: "clamp(38px, 7vw, 68px)" }}
          >
            Cobre o que
            <br />
            o seu trabalho
            <br />
            <span className="italic text-accent">realmente vale.</span>
          </h1>
          <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-ink-soft">
            Posicionamento, vendas e constância aplicados ao seu negócio. Role para acessar a mentoria.
          </p>
          <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
            <span
              className="h-[34px] w-px"
              style={{ background: "linear-gradient(to bottom, var(--color-accent), transparent)" }}
            />
            Role para entrar
          </div>
        </div>

        <div className="mt-[280px] max-w-[560px] md:mt-[360px]">
          <p className="font-display text-[26px] italic leading-[1.35] text-ink md:text-[36px]">
            &ldquo;Personal bom que cobra pouco não é generoso. É invisível.&rdquo;
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
            Victor Carvalho
          </p>
        </div>

        <div className="mt-24 grid max-w-[720px] gap-8 md:mt-32 md:grid-cols-3">
          {PILARES.map((pilar) => (
            <div key={pilar.numero}>
              <p className="font-mono text-[11px] text-accent">PILAR {pilar.numero}</p>
              <h3 className="font-display mt-2 text-[24px] text-ink">{pilar.nome}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{pilar.descricao}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 flex justify-center md:mt-32">
          <div
            className="w-full max-w-[440px] rounded-[6px] border border-line px-9 py-11 backdrop-blur-md"
            style={{ background: "rgba(16,14,11,0.88)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Área do mentorado</p>
            <h2 className="font-display mt-2 text-[32px] text-ink">Acessar a mentoria</h2>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
