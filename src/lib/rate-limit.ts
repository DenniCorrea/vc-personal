import { prisma } from "@/lib/prisma";

// Limite de tentativas por acao sensivel. Os numeros sao folgados o
// suficiente pra ninguem legitimo esbarrar neles (quem erra a senha 3x
// normalmente acerta na 4a), e apertados o suficiente pra forca bruta
// deixar de ser viavel: 8 tentativas a cada 15min sao ~32/hora, contra as
// milhares por segundo que um script tentaria sem isso.
export const LIMITES = {
  login: { max: 8, janelaMinutos: 15 },
  recuperacaoSenha: { max: 5, janelaMinutos: 60 },
  cadastro: { max: 5, janelaMinutos: 60 },
} as const;

type Acao = keyof typeof LIMITES;

// A chave e "acao:alvo" pra que o contador de login de uma pessoa nunca
// interfira no de recuperacao de senha dela. O alvo vai normalizado
// (minusculo, sem espaco) senao "A@x.com" e "a@x.com " contariam separado.
function montarChave(acao: Acao, alvo: string): string {
  return `${acao}:${alvo.trim().toLowerCase()}`;
}

function inicioDaJanela(acao: Acao): Date {
  const desde = new Date();
  desde.setMinutes(desde.getMinutes() - LIMITES[acao].janelaMinutos);
  return desde;
}

// Só CONSULTA — não registra nada. Usado antes de tentar a operação, pra
// poder responder "bloqueado" sem gastar bcrypt nem disparar e-mail.
export async function estaBloqueado(acao: Acao, alvo: string): Promise<boolean> {
  const tentativas = await prisma.tentativaAutenticacao.count({
    where: { chave: montarChave(acao, alvo), criadoEm: { gte: inicioDaJanela(acao) } },
  });
  return tentativas >= LIMITES[acao].max;
}

// Registra UMA tentativa falha. Só chamamos isso quando a operação de fato
// falhou — acerto de senha não pode consumir a cota de quem só errou uma vez
// antes de lembrar a senha certa.
export async function registrarFalha(acao: Acao, alvo: string): Promise<void> {
  await prisma.tentativaAutenticacao.create({
    data: { chave: montarChave(acao, alvo) },
  });
}

// Login bem-sucedido zera o contador daquele e-mail: quem provou que é dono
// da conta não deve carregar o peso das tentativas erradas anteriores.
export async function limparTentativas(acao: Acao, alvo: string): Promise<void> {
  await prisma.tentativaAutenticacao.deleteMany({
    where: { chave: montarChave(acao, alvo) },
  });
}

// Chamado pelo cron de alertas. Sem isso a tabela só cresce — linhas fora
// de qualquer janela de limite não servem mais pra nada.
export async function limparTentativasAntigas(): Promise<number> {
  const umDiaAtras = new Date();
  umDiaAtras.setDate(umDiaAtras.getDate() - 1);
  const { count } = await prisma.tentativaAutenticacao.deleteMany({
    where: { criadoEm: { lt: umDiaAtras } },
  });
  return count;
}
