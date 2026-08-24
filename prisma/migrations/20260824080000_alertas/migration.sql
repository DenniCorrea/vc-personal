-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('RENOVACAO_PROXIMA', 'ASSINATURA_ATRASADA', 'ALUNO_SEM_RENOVACAO', 'HABITO_AGUA', 'HABITO_SONO', 'AGENDA');

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "chaveDedup" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alertas_chaveDedup_key" ON "alertas"("chaveDedup");

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

