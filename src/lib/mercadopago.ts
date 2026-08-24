import { MercadoPagoConfig } from "mercadopago";

// Uma unica instancia de config, reaproveitada em todo o app — cada
// resource (Preference, PreApproval, Payment) recebe essa mesma config
// quando e instanciado onde for usado.
export const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 8000 },
});

// URL base do proprio app, usada pra montar os links de volta (back_url) e
// o endereco que o Mercado Pago chama depois do pagamento (notification_url).
// Em dev e http://localhost:3000; em produção (Fase 11) vira o dominio real.
export function urlBase(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

// 6% de desconto no Pix — regra de negocio fixa, mesma usada em toda a Fase 5.
export function aplicarDescontoPix(valor: number): { desconto: number; valorFinal: number } {
  const desconto = Number((valor * 0.06).toFixed(2));
  return { desconto, valorFinal: Number((valor - desconto).toFixed(2)) };
}
