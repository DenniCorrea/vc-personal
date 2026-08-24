import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Recebe o arquivo direto da action (Server Actions recebem File do form),
// sobe pro Cloudinary dentro de uma pasta por tipo, e devolve so a URL —
// e a URL que guardamos no banco (Usuario.avatarUrl, FotoProgresso.url).
export async function enviarImagem(
  arquivo: File,
  pasta: "avatares" | "fotos-progresso" | "anatomia",
): Promise<string> {
  const bytes = await arquivo.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const resultado = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: `vc-personal/${pasta}` },
      (erro, resultado) => {
        if (erro || !resultado) return reject(erro ?? new Error("Falha no upload"));
        resolve(resultado);
      },
    );
    upload.end(buffer);
  });

  return resultado.secure_url;
}
