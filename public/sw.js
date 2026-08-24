// Service worker minimo — so pra satisfazer o criterio de "instalavel" do
// Chrome/Android (precisa de um SW registrado com um listener de fetch,
// mesmo que ele nao faca cache nenhum). Sem isso o navegador nao mostra o
// prompt de "instalar app".
self.addEventListener("fetch", () => {});
