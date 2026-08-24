-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'PERSONAL_PARCEIRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "Produto" AS ENUM ('ALUNO', 'MENTORIA');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('MENSAL', 'TRIMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('PENDENTE', 'ATIVA', 'ATRASADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('VIDEO', 'PRESENCIAL', 'DISTANCIA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "cpfHash" TEXT,
    "endereco" TEXT,
    "consentimentoLgpdEm" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "produto" "Produto" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL DEFAULT 'MENSAL',
    "frequenciaSemanal" INTEGER,
    "limiteAgendamentos" INTEGER,
    "incluiNutricao" BOOLEAN NOT NULL DEFAULT false,
    "tiposAtendimento" "TipoAtendimento"[],
    "beneficios" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'PENDENTE',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataProximaRenovacao" TIMESTAMP(3) NOT NULL,
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpfHash_key" ON "usuarios"("cpfHash");

-- CreateIndex
CREATE UNIQUE INDEX "planos_produto_nome_key" ON "planos"("produto", "nome");

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
