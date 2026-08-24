-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'PERSONAL_PARCEIRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'ATRASADA', 'CANCELADA', 'EXPIRADA');

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
CREATE TABLE "planos_aluno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "frequenciaSemanal" INTEGER NOT NULL,
    "incluiNutricao" BOOLEAN NOT NULL DEFAULT false,
    "tiposAtendimento" "TipoAtendimento"[],
    "precoMensal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_consultoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoMensal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_consultoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planoAlunoId" TEXT,
    "planoConsultoriaId" TEXT,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
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
CREATE UNIQUE INDEX "planos_aluno_nome_key" ON "planos_aluno"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "planos_consultoria_nome_key" ON "planos_consultoria"("nome");

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_planoAlunoId_fkey" FOREIGN KEY ("planoAlunoId") REFERENCES "planos_aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_planoConsultoriaId_fkey" FOREIGN KEY ("planoConsultoriaId") REFERENCES "planos_consultoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
