import { redirect } from "next/navigation";

// A home antiga (Fase 1) foi substituida pela "/login" — ela ja combina o
// hero de marca com o formulario de acesso num scroll so (handoff Metodo
// Lider, tela 1a). Manter as duas so duplicava a mesma porta de entrada
// com visuais diferentes.
export default function Home() {
  redirect("/login");
}
