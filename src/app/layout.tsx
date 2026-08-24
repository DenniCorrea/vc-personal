import type { Metadata } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Identidade visual do handoff "Metodo Lider" (design_handoff_metodo_lider/README.md):
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
