"use client";

import { useEffect, useState } from "react";

// Contador de urgencia dos bonus (handoff, tela 5d).
//
// O PRAZO vem do servidor (a data absoluta de expiracao, calculada de
// `expiraEm` no banco) — o cliente so formata e faz o tique. Isso importa:
// se o cliente calculasse "faltam X horas" a partir do relogio dele,
// bastaria mudar a hora do computador pra ver conteudo expirado.
//
// Ritmo do tique conforme o handoff: de minuto em minuto quando falta
// menos de 48h, e de hora em hora quando o prazo e folgado (nao adianta
// re-renderizar a cada minuto pra mudar "12 dias" uma vez por dia).
export function ContadorExpiracao({
  expiraEmIso,
  className,
}: {
  expiraEmIso: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(() => formatar(expiraEmIso));

  useEffect(() => {
    const restante = new Date(expiraEmIso).getTime() - Date.now();
    const intervalo = restante < 48 * 3_600_000 ? 60_000 : 3_600_000;
    const id = setInterval(() => setTexto(formatar(expiraEmIso)), intervalo);
    return () => clearInterval(id);
  }, [expiraEmIso]);

  return <span className={className}>{texto}</span>;
}

function formatar(expiraEmIso: string): string {
  const ms = new Date(expiraEmIso).getTime() - Date.now();
  if (ms <= 0) return "Expirado";

  const horas = Math.floor(ms / 3_600_000);
  if (horas < 48) {
    const minutos = Math.floor((ms % 3_600_000) / 60_000);
    return `${horas}h ${String(minutos).padStart(2, "0")}min`;
  }
  const dias = Math.ceil(ms / 86_400_000);
  return `${dias} dias`;
}

// Mesma regra de cor do handoff: ouro quando aperta (menos de 7 dias),
// neutro quando o prazo e folgado.
export function corDaUrgencia(expiraEm: Date): string {
  const dias = (expiraEm.getTime() - Date.now()) / 86_400_000;
  return dias < 7 ? "var(--color-accent)" : "var(--color-ink-soft)";
}
