-- CreateTable
CREATE TABLE "tokens_recuperacao_senha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacao_senha_tokenHash_key" ON "tokens_recuperacao_senha"("tokenHash");

-- AddForeignKey
ALTER TABLE "tokens_recuperacao_senha" ADD CONSTRAINT "tokens_recuperacao_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

