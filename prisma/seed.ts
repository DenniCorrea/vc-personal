// Popula o banco com dados de teste: 1 admin, 1 aluno, 1 personal-parceiro e
// os 2 catalogos de plano. Usa `upsert` em vez de `create` em tudo — assim
// rodar `prisma db seed` de novo nao quebra por causa de e-mail/nome duplicado
// (idempotente, como recomenda a propria doc do Prisma).
// Carrega o .env de forma explicita: quando rodado via `prisma db seed`, o
// prisma.config.ts ja carregou o .env antes de chamar este script — mas esse
// import garante que `tsx prisma/seed.ts` tambem funcione sozinho, direto.
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

async function main() {
  const senhaHashPadrao = await bcrypt.hash("trocar123", 10);
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

  const planoAluno3x = await prisma.planoAluno.upsert({
    where: { nome: "Plano 3x Semana" },
    update: {},
    create: {
      nome: "Plano 3x Semana",
      frequenciaSemanal: 3,
      incluiNutricao: true,
      tiposAtendimento: ["VIDEO", "PRESENCIAL"],
      precoMensal: 350.0,
    },
  });

  const planoConsultoria = await prisma.planoConsultoria.upsert({
    where: { nome: "Consultoria de Posicionamento" },
    update: {},
    create: {
      nome: "Consultoria de Posicionamento",
      descricao:
        "Conteudo padrao + 1 video novo por semana para personais que querem cobrar mais.",
      precoMensal: 297.0,
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
          planoAlunoId: planoAluno3x.id,
          status: "ATIVA",
          dataProximaRenovacao: emUmMes,
        },
      },
    },
  });

  const personalParceiro = await prisma.usuario.upsert({
    where: { email: "personal.teste@vcpersonal.com" },
    update: {},
    create: {
      email: "personal.teste@vcpersonal.com",
      nome: "Personal Parceiro Teste",
      senhaHash: senhaHashPadrao,
      role: "PERSONAL_PARCEIRO",
      telefone: "+55 11 91111-1111",
      cpfHash: hashCpf("11111111111"),
      consentimentoLgpdEm: new Date(),
      assinaturas: {
        create: {
          planoConsultoriaId: planoConsultoria.id,
          status: "ATIVA",
          dataProximaRenovacao: emUmMes,
        },
      },
    },
  });

  console.log({
    admin: admin.email,
    aluno: aluno.email,
    personalParceiro: personalParceiro.email,
    planos: [planoAluno3x.nome, planoConsultoria.nome],
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
