// Popula o banco com dados de teste: 1 admin, 1 aluno, 1 personal-trainer
// mentorado e os planos de exemplo dos dois produtos. Usa `upsert` em vez de
// `create` em tudo — assim rodar `prisma db seed` de novo nao quebra por
// causa de e-mail/nome duplicado (idempotente, como recomenda a propria doc
// do Prisma).
import "dotenv/config";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Mesma logica de hash que vai proteger o CPF em produção (Fase 2): nunca
// texto puro, so um hash pra checar duplicidade.
function hashCpf(cpf: string): string {
  return createHash("sha256").update(cpf).digest("hex");
}

// A senha das contas de exemplo vem do ambiente, NUNCA do codigo.
//
// Antes estava escrita aqui como literal. Enquanto o repositorio era
// privado isso passava, mas a mesma senha valia nas contas do banco de
// producao — ou seja, publicar o codigo seria publicar o login de ADMIN do
// app no ar. Senha em arquivo versionado nao tem como ser trocada sem
// reescrever historico: por isso ela sai do codigo, nao so muda de valor.
//
// Sem a variavel definida, o seed PARA em vez de cair num padrao fraco:
// um valor padrao silencioso e exatamente como senha fraca sobrevive.
function senhaDoSeed(): string {
  const senha = process.env.SEED_SENHA_PADRAO;
  if (!senha || senha.length < 12) {
    throw new Error(
      "Defina SEED_SENHA_PADRAO no .env (mínimo 12 caracteres) antes de rodar o seed. " +
        "Gere uma com: node -e \"console.log(require('crypto').randomBytes(12).toString('base64url'))\"",
    );
  }
  return senha;
}

async function main() {
  const senhaHashPadrao = await bcrypt.hash(senhaDoSeed(), 10);
  const emUmMes = new Date();
  emUmMes.setMonth(emUmMes.getMonth() + 1);

  const admin = await prisma.usuario.upsert({
    where: { email: "victor@vcpersonal.com" },
    update: {},
    create: {
      email: "victor@vcpersonal.com",
      nome: "Victor Carvalho",
      senhaHash: senhaHashPadrao,
      role: "ADMIN",
      consentimentoLgpdEm: new Date(),
    },
  });

  const planoAluno3x = await prisma.plano.upsert({
    where: { produto_nome: { produto: "ALUNO", nome: "Plano 3x Semana" } },
    update: {},
    create: {
      produto: "ALUNO",
      nome: "Plano 3x Semana",
      frequenciaSemanal: 3,
      limiteAgendamentos: 3,
      incluiNutricao: true,
      tiposAtendimento: ["VIDEO", "PRESENCIAL"],
      preco: 350.0,
    },
  });

  const planoMentoria = await prisma.plano.upsert({
    where: { produto_nome: { produto: "MENTORIA", nome: "Mentoria Líder PRO" } },
    update: {},
    create: {
      produto: "MENTORIA",
      nome: "Mentoria Líder PRO",
      descricao:
        "Posicionamento, abordagem, mapeamento, vendas e fidelização para personal trainers que querem sair da guerra de preço.",
      beneficios: ["Conteúdo padrão dos 5 pilares", "1 vídeo novo por semana", "Agenda própria de consultoria"],
      preco: 297.0,
    },
  });

  const aluno = await prisma.usuario.upsert({
    where: { email: "aluno.teste@vcpersonal.com" },
    update: {},
    create: {
      email: "aluno.teste@vcpersonal.com",
      nome: "Aluno Teste",
      senhaHash: senhaHashPadrao,
      role: "ALUNO",
      telefone: "+55 11 90000-0000",
      cpfHash: hashCpf("00000000000"),
      consentimentoLgpdEm: new Date(),
      assinaturas: {
        create: {
          planoId: planoAluno3x.id,
          status: "ATIVA",
          dataProximaRenovacao: emUmMes,
        },
      },
    },
  });

  const personalMentorado = await prisma.usuario.upsert({
    where: { email: "personal.teste@vcpersonal.com" },
    update: {},
    create: {
      email: "personal.teste@vcpersonal.com",
      nome: "Personal Trainer Teste",
      senhaHash: senhaHashPadrao,
      role: "PERSONAL_PARCEIRO",
      telefone: "+55 11 91111-1111",
      cpfHash: hashCpf("11111111111"),
      consentimentoLgpdEm: new Date(),
      assinaturas: {
        create: {
          planoId: planoMentoria.id,
          status: "ATIVA",
          dataProximaRenovacao: emUmMes,
        },
      },
    },
  });

  console.log({
    admin: admin.email,
    aluno: aluno.email,
    personalMentorado: personalMentorado.email,
    planos: [planoAluno3x.nome, planoMentoria.nome],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
