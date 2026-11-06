import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "./RegistrarServiceWorker";

// Identidade visual do handoff "Metodo Lider" (design_handoff_aluno_b2c/README.md):
// Manrope pra interface, Instrument Serif pra titulos/falas/citacoes.
const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Victor Carvalho Personal",
  description: "Área do aluno, do personal-parceiro e do admin do Victor Carvalho Personal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Método Líder",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Acompanha o bg/base da paleta Dark & Gold (RESPONSIVE.md do handoff
  // B2B pede exatamente esse valor). Se divergir do fundo real, a barra de
  // status do celular fica de uma cor e a tela de outra.
  themeColor: "#0A0908",
  colorScheme: "dark",
  // viewport-fit=cover + env(safe-area-inset-*) sao obrigatorios (RESPONSIVE.md)
  // pra bottom nav e barras fixas respeitarem o home indicator do iPhone.
  viewportFit: "cover",
  // Sem maximum-scale/user-scalable=no — quebra acessibilidade (RESPONSIVE.md).
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}
