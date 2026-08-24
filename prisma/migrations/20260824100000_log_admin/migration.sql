-- CreateTable
CREATE TABLE "logs_admin" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logs_admin" ADD CONSTRAINT "logs_admin_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

