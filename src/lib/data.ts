// O app inteiro opera num fuso so: o do Victor e dos mentorados dele.
//
// Isso PRECISA ser explicito, nao herdado do processo Node: em
// desenvolvimento a maquina esta em America/Sao_Paulo, mas em producao a
// Render roda em UTC. Sem declarar o fuso, a mesma data/hora aparecia
// diferente nos dois ambientes — um horario marcado pras 14h chegava a
// mostrar 17h, e um cadastro feito as 22h aparecia com a data do dia
// seguinte.
//
// O Brasil nao tem mais horario de verao (abolido em 2019), entao o offset
// e fixo em -03:00. Se isso voltar um dia, este e o unico lugar a mudar.
export const FUSO = "America/Sao_Paulo";
export const OFFSET_FUSO = "-03:00";

// Fabrica de formatadores ja amarrados ao fuso do app. Usar SEMPRE isto em
// vez de `new Intl.DateTimeFormat("pt-BR", {...})` direto, senao volta a
// depender do fuso do servidor.
export function formatador(opcoes: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("pt-BR", { ...opcoes, timeZone: FUSO });
}

// Converte "2026-08-30" + "14:00" no instante correto — as 14h NO BRASIL,
// nao as 14h do fuso onde o servidor por acaso esta rodando.
export function dataHoraLocal(data: string, hora: string): Date {
  return new Date(`${data}T${hora}:00${OFFSET_FUSO}`);
}

// So a data (sem hora) de "hoje" no fuso do app, normalizada pra
// meia-noite UTC — que e como o Postgres guarda um campo @db.Date (sem
// hora nem fuso). Ler o "hoje" do relogio do servidor daria o dia errado
// nas primeiras 3 horas de cada dia em UTC (21h-00h no Brasil).
export function hojeData(): Date {
  const partes = formatador({ year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return new Date(Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day)));
}

// "AAAA-MM-DD" pra preencher um <input type="date">, no fuso do app.
// Antes usava os componentes LOCAIS do processo — o que dava a data certa
// no dev (maquina no Brasil) e a errada em producao (Render em UTC) pra
// qualquer registro criado depois das 21h.
export function paraInputDate(data: Date): string {
  const p = formatador({ year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(data)
    .reduce<Record<string, string>>((acc, x) => ({ ...acc, [x.type]: x.value }), {});
  return `${p.year}-${p.month}-${p.day}`;
}

// "DD/MM" ou "DD/MM/AAAA" pra EXIBIR um campo @db.Date (Avaliacao.data,
// ExecucaoExercicio.data, etc.). ATENCAO: usa os componentes UTC, NAO os
// locais — diferente do paraInputDate acima. A diferenca importa: um
// @db.Date do Postgres nao tem hora nem fuso, e o driver do Prisma sempre
// devolve esse valor como meia-noite UTC. Se o processo Node estiver rodando
// num fuso atras de UTC (Brasil, UTC-3 — o caso do dev local), ler esse
// valor com getters LOCAIS mostra o dia ANTERIOR. `paraInputDate` funciona
// com getters locais porque so e usado em campos DateTime de verdade
// (publicadoEm), onde "hora local" faz sentido — aqui nao ha hora nenhuma
// pra converter, entao os getters UTC sao os certos.
export function formatarDataCurta(data: Date, comAno = false): string {
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return comAno ? `${dia}/${mes}/${data.getUTCFullYear()}` : `${dia}/${mes}`;
}

// "Que horas são agora", em milissegundos.
//
// Por que existe, em vez de `Date.now()` espalhado pelas telas: o projeto
// trata tempo num lugar só (ver FUSO e dataHoraLocal acima), e "agora" é
// tempo. Três telas liam o relógio por conta própria para decidir o que já
// expirou, há quantos dias alguém sumiu e em que semana de mentoria a pessoa
// está — cada uma com a sua chamada solta.
//
// O `react-hooks/purity` reclama de ler o relógio durante o render, e está
// certo em princípio: com memoização, o valor poderia congelar. Aqui não
// congela, porque TODA tela que chama isto é dinâmica — elas passam por
// `exigirSessao`/`exigirPapel`, que lê cookie, e cookie força renderização
// por requisição (confirmado no build: as rotas saem marcadas como `ƒ`).
//
// Centralizar aqui também silenciou a regra sem precisar de supressão: ela
// mira leitura de relógio DENTRO do componente, e aqui já não é. Se um dia
// alguma dessas telas deixar de ser dinâmica, o lugar de corrigir é este.
export const agoraEmMs = (): number => Date.now();
