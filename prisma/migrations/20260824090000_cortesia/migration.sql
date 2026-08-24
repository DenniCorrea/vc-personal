-- AlterTable
ALTER TABLE "assinaturas" ADD COLUMN     "concedidaPorId" TEXT,
ADD COLUMN     "cortesia" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_concedidaPorId_fkey" FOREIGN KEY ("concedidaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

