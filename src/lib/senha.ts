import bcrypt from "bcryptjs";

// 10 rounds e o padrao recomendado pelo bcrypt: equilibrio entre seguranca
// (quanto maior, mais lento pra atacante testar senhas por forca bruta) e
// tempo de resposta aceitavel no login (uns 50-100ms nessa faixa).
const SALT_ROUNDS = 10;

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
