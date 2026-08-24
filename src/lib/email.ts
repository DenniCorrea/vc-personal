import { Resend } from "resend";
import { urlBase } from "@/lib/mercadopago";

const resend = new Resend(process.env.RESEND_API_KEY);

// "onboarding@resend.dev" e o remetente de teste do Resend — funciona sem
// precisar verificar um dominio proprio. Quando o Victor tiver um dominio
// configurado no Resend, so trocar essa constante.
const REMETENTE = "Victor Carvalho Personal <onboarding@resend.dev>";

export async function enviarEmailRecuperacaoSenha(email: string, nome: string, token: string) {
  const link = `${urlBase()}/redefinir-senha?token=${token}`;

  await resend.emails.send({
    from: REMETENTE,
    to: email,
    subject: "Recuperação de senha — Victor Carvalho Personal",
    html: `
      <p>Olá, ${nome}.</p>
      <p>Pediram a redefinição da sua senha. Se foi você, clique no link abaixo (válido por 1 hora):</p>
      <p><a href="${link}">${link}</a></p>
      <p>Se não foi você, pode ignorar esse e-mail — sua senha continua a mesma.</p>
    `,
  });
}
