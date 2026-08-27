import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { urlAssinadaPrivada } from "@/lib/cloudinary";

// Entrega uma foto de progresso pro navegador, conferindo permissao a CADA
// requisicao.
//
// Por que a foto nao vai direto do Cloudinary pro <img>: mesmo com o
// arquivo privado, a URL assinada do Cloudinary NAO expira. Se ela chegasse
// ao navegador, bastaria alguem copiar o endereco (histórico, print,
// compartilhamento acidental) pra aquela foto ficar acessivel pra sempre,
// sem login. Aqui o navegador so conhece /api/fotos-progresso/<id>, que sem
// sessao valida nao devolve nada.
//
// Foto de progresso e o dado mais sensivel do app (dado de saude pela LGPD,
// art. 5, II) — por isso essa rota e a unica imagem do projeto que passa
// pelo nosso servidor em vez de ir direto da CDN.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }

  const foto = await prisma.fotoProgresso.findUnique({
    where: { id },
    select: { publicId: true, formato: true, usuarioId: true },
  });

  // Dono da foto, ou o Victor (ADMIN) — que precisa ver a evolucao do aluno
  // pra fazer o trabalho dele. Qualquer outro caso responde 404, e nao 403:
  // "403" confirmaria que a foto existe, e isso ja e informacao demais.
  const podeVer = foto && (foto.usuarioId === session.user.id || session.user.role === "ADMIN");
  if (!podeVer) {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }

  const resposta = await fetch(urlAssinadaPrivada(foto.publicId, foto.formato));
  if (!resposta.ok || !resposta.body) {
    console.error("Falha ao buscar foto no Cloudinary:", foto.publicId, resposta.status);
    return NextResponse.json({ erro: "imagem indisponível" }, { status: 502 });
  }

  return new NextResponse(resposta.body, {
    headers: {
      "Content-Type": resposta.headers.get("content-type") ?? "image/jpeg",
      // `private` impede que CDN ou proxy guardem a imagem pra servir a
      // outra pessoa depois. O cache do proprio navegador continua valendo
      // (1h) pra galeria nao rebaixar tudo a cada visita.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
