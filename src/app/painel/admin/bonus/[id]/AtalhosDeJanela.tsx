"use client";

// Atalhos de janela do handoff (6c): 48h / 7 dias / 30 dias. Preenchem os
// campos de data/hora a partir de AGORA — o Victor quase sempre quer
// "libera hoje e fecha em X", nao escolher duas datas no calendario.
const ATALHOS = [
  { rotulo: "48h", horas: 48 },
  { rotulo: "7 dias", horas: 24 * 7 },
  { rotulo: "30 dias", horas: 24 * 30 },
] as const;

function partes(d: Date) {
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => ({ ...acc, [x.type]: x.value }), {});
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function AtalhosDeJanela() {
  function aplicar(horas: number) {
    const agora = new Date();
    const fim = new Date(agora.getTime() + horas * 3_600_000);
    const inicio = partes(agora);
    const termino = partes(fim);

    const set = (nome: string, valor: string) => {
      const el = document.querySelector<HTMLInputElement>(`[name="${nome}"]`);
      if (!el) return;
      el.value = valor;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set("dataLibera", inicio.data);
    set("horaLibera", inicio.hora);
    set("dataExpira", termino.data);
    set("horaExpira", termino.hora);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-ink-soft">Atalhos:</span>
      {ATALHOS.map((a) => (
        <button
          key={a.rotulo}
          type="button"
          onClick={() => aplicar(a.horas)}
          className="min-h-10 rounded-[2px] border border-line px-3 py-1.5 text-[12px] text-ink hover:border-accent-border"
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}
