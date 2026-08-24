-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('CARTAO', 'DEBITO', 'PIX');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO');

-- AlterTable
ALTER TABLE "assinaturas" ADD COLUMN     "mercadoPagoPreapprovalId" TEXT;

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "assinaturaId" TEXT,
    "agendamentoId" TEXT,
    "valorOriginal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorFinal" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPreferenceId_key" ON "pagamentos"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPaymentId_key" ON "pagamentos"("mercadoPagoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_mercadoPagoPreapprovalId_key" ON "assinaturas"("mercadoPagoPreapprovalId");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "assinaturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

