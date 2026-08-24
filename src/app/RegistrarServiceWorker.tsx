"use client";

import { useEffect } from "react";

// Registra o service worker minimo — condicao pro navegador oferecer
// "instalar app" (junto com o manifest.json e os icones).
export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
