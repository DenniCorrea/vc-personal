"use client";

// Ponte entre o player e o formulario de duvida.
//
// Os dois sao componentes irmaos dentro de um Server Component (a pagina da
// aula), entao nao da pra passar estado por prop nem levantar useState sem
// transformar a pagina inteira em client. Um modulo compartilhado resolve.
//
// O tempo e PERGUNTADO ao player no momento do clique, e nao acumulado a
// cada `timeupdate`. Dois motivos:
//
// 1. Precisao: o minuto que interessa e o do instante em que a pessoa
//    decidiu perguntar, nao o do ultimo tique que passou.
// 2. Robustez: `timeupdate` e um evento continuo, e navegador estrangula
//    evento continuo quando a aba nao esta sendo desenhada (segundo plano,
//    janela minimizada). Perguntar e uma troca discreta — funciona sempre.
//
// Guardado junto do `aulaId`: sem isso, navegar da aula 4 pra 5 deixaria o
// player antigo pendurado e a duvida sairia ancorada na aula errada.

type Ligacao = {
  aulaId: string;
  lerTempo: () => Promise<number>;
  pausar: () => void;
};

let ligacao: Ligacao | null = null;

export function conectarPlayer(l: Ligacao) {
  ligacao = l;
}

export function desconectarPlayer(aulaId: string) {
  if (ligacao?.aulaId === aulaId) ligacao = null;
}

// Devolve null quando nao ha tempo confiavel: aula sem video, player que
// nao respondeu, ou vinculo de OUTRA aula. Nesses casos o formulario mostra
// o campo manual em vez de inventar um minuto.
export async function tempoDaAula(aulaId: string): Promise<number | null> {
  if (ligacao?.aulaId !== aulaId) return null;
  try {
    const segundos = await ligacao.lerTempo();
    if (!Number.isFinite(segundos) || segundos <= 0) return null;
    return Math.floor(segundos);
  } catch {
    return null;
  }
}

export function pausar(aulaId: string) {
  if (ligacao?.aulaId === aulaId) ligacao.pausar();
}

export function formatarMinuto(segundos: number): string {
  const m = Math.floor(segundos / 60);
  return `${m}:${String(segundos % 60).padStart(2, "0")}`;
}
