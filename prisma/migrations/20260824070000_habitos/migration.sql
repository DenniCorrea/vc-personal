-- CreateEnum
CREATE TYPE "TipoHabito" AS ENUM ('AGUA', 'SONO');

-- CreateEnum
CREATE TYPE "FrequenciaMensagem" AS ENUM ('DIARIA', 'SEMANAL');

-- CreateTable
CREATE TABLE "habitos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoHabito" NOT NULL,
    "metaValor" DOUBLE PRECISION NOT NULL,
    "lembreteHorario" TEXT,
    "lembreteAtivo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habito_registros" (
    "id" TEXT NOT NULL,
    "habitoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habito_registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_mentalidade" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "frequencia" "FrequenciaMensagem" NOT NULL DEFAULT 'DIARIA',
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_mentalidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "habitos_usuarioId_tipo_key" ON "habitos"("usuarioId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "habito_registros_habitoId_data_key" ON "habito_registros"("habitoId", "data");

-- AddForeignKey
ALTER TABLE "habitos" ADD CONSTRAINT "habitos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habito_registros" ADD CONSTRAINT "habito_registros_habitoId_fkey" FOREIGN KEY ("habitoId") REFERENCES "habitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

