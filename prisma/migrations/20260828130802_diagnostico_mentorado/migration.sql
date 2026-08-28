-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ticketInicial" DECIMAL(10,2) NOT NULL,
    "alunosInicial" INTEGER NOT NULL,
    "maiorGargalo" TEXT NOT NULL,
    "ticketAtual" DECIMAL(10,2),
    "alunosAtual" INTEGER,
    "respondidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_usuarioId_key" ON "diagnosticos"("usuarioId");

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
