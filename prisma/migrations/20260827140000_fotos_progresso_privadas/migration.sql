-- Fotos de progresso deixam de ter URL publica.
-- Seguro rodar sem migrar dado: a tabela esta vazia (nenhum aluno enviou
-- foto ainda) — conferido antes de gerar esta migration.
ALTER TABLE "fotos_progresso" DROP COLUMN "url";
ALTER TABLE "fotos_progresso" ADD COLUMN "publicId" TEXT NOT NULL;
ALTER TABLE "fotos_progresso" ADD COLUMN "formato" TEXT NOT NULL;
