// As regras da comunidade, num lugar so.
//
// Este arquivo NAO importa o Prisma de proposito: ele e lido tambem por
// client component (o botao Denunciar). Import de servidor aqui arrastaria
// o cliente do banco pro bundle do navegador — o Turbopack quebra o build
// com "does not support external modules (node:module)", que foi
// exatamente o que aconteceu em 10/09/2026. O acesso ao banco mora em
// ./moderacao-servidor.ts.
//
// Moderacao sem regra escrita e arbitrio: a pessoa cujo post sumiu nao tem
// como saber o que fez, e o Victor nao tem em que se apoiar quando alguem
// reclamar. Por isso a mesma lista aparece na tela do mentorado (para ele
// ler antes de publicar) e e a base do texto que ele recebe quando algo e
// removido.
export const REGRAS_COMUNIDADE = [
  "Fale de negócio: posicionamento, abordagem, precificação, resultado com aluno.",
  "Sem venda de produto ou serviço próprio, nem recrutamento para outro grupo.",
  "Sem ataque pessoal, preconceito ou exposição de terceiros — critique a ideia, não a pessoa.",
  "Nada de dado pessoal de aluno (nome completo, foto, telefone) sem a autorização dele.",
  "Resultado publicado tem que ser real. Número inventado tira a confiança do grupo inteiro.",
] as const;

export const ROTULO_MOTIVO: Record<string, string> = {
  SPAM: "Spam ou divulgação",
  OFENSA: "Ataque ou ofensa",
  CONTEUDO_IMPROPRIO: "Conteúdo impróprio",
  FORA_DO_TEMA: "Fora do tema",
  OUTRO: "Outro",
};

// Silenciar e uma PUNICAO PROPORCIONAL: tira a voz no feed sem tirar o que a
// pessoa pagou (aulas, sessoes, material). Desativar a conta inteira por uma
// briga na comunidade seria cobrar por um produto e entregar menos.
export type Silenciamento = { silenciado: false } | { silenciado: true; ate: Date; motivo: string | null };

export function lerSilenciamento(usuario: {
  comunidadeSilenciadaAte: Date | null;
  comunidadeMotivoSilencio: string | null;
}): Silenciamento {
  if (!usuario.comunidadeSilenciadaAte || usuario.comunidadeSilenciadaAte <= new Date()) {
    return { silenciado: false };
  }
  return {
    silenciado: true,
    ate: usuario.comunidadeSilenciadaAte,
    motivo: usuario.comunidadeMotivoSilencio,
  };
}
