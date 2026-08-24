-- CreateEnum
CREATE TYPE "ObjetivoAluno" AS ENUM ('HIPERTROFIA', 'EMAGRECIMENTO', 'SAUDE_CONSTANCIA', 'PERFORMANCE');

-- CreateEnum
CREATE TYPE "TempoTreino" AS ENUM ('NUNCA_TREINOU', 'UM_A_TRES_ANOS', 'MAIS_DE_TRES_ANOS');

-- CreateEnum
CREATE TYPE "StatusCheckinNutricional" AS ENUM ('SEGUIU', 'ADAPTOU');

-- AlterTable
ALTER TABLE "exercicios" ADD COLUMN     "grupoMuscularPrincipal" TEXT,
ADD COLUMN     "gruposMuscularesSecundarios" TEXT[],
ADD COLUMN     "imagemAnatomica" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "anamneses" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tempoTreino" "TempoTreino" NOT NULL,
    "diasDisponiveis" INTEGER NOT NULL,
    "objetivo" "ObjetivoAluno" NOT NULL,
    "lesoesRestricoes" TEXT,
    "respondidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "percentualGordura" DOUBLE PRECISION,
    "medidas" JSONB,
    "observacoesNutricionais" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_exercicio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "numeroSerie" INTEGER NOT NULL,
    "carga" DOUBLE PRECISION,
    "repeticoes" INTEGER,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execucoes_exercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_nutricionais" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "metaAguaLitros" DOUBLE PRECISION,
    "metaSonoHoras" DOUBLE PRECISION,
    "metaProteinaG" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_nutricionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refeicoes" (
    "id" TEXT NOT NULL,
    "planoNutricionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "horario" TEXT,
    "composicao" TEXT NOT NULL,
    "kcal" INTEGER,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "refeicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins_nutricionais" (
    "id" TEXT NOT NULL,
    "refeicaoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "status" "StatusCheckinNutricional" NOT NULL,
    "observacaoAdaptacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_nutricionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_progresso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anamneses_usuarioId_key" ON "anamneses"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "execucoes_exercicio_usuarioId_exercicioId_data_numeroSerie_key" ON "execucoes_exercicio"("usuarioId", "exercicioId", "data", "numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "planos_nutricionais_usuarioId_key" ON "planos_nutricionais"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_nutricionais_refeicaoId_data_key" ON "checkins_nutricionais"("refeicaoId", "data");

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_exercicio" ADD CONSTRAINT "execucoes_exercicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_exercicio" ADD CONSTRAINT "execucoes_exercicio_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_nutricionais" ADD CONSTRAINT "planos_nutricionais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refeicoes" ADD CONSTRAINT "refeicoes_planoNutricionalId_fkey" FOREIGN KEY ("planoNutricionalId") REFERENCES "planos_nutricionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins_nutricionais" ADD CONSTRAINT "checkins_nutricionais_refeicaoId_fkey" FOREIGN KEY ("refeicaoId") REFERENCES "refeicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_progresso" ADD CONSTRAINT "fotos_progresso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

