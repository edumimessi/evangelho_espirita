// Service worker mínimo e conservador para tornar o app instalável (PWA)
// e dar uma tela offline básica. Regras de segurança:
//  - Só intercepta GET do mesmo domínio.
//  - NUNCA cacheia /api/ (dados dinâmicos, login, IA) — sempre rede.
//  - Navegações: rede primeiro, com index.html do cache como reserva offline.
//  - Demais estáticos: usa cache e atualiza em segundo plano (stale-while-revalidate).
const CACHE = "evangelho-espirita-v2";
// offline.html é autossuficiente (sem JS/CSS externos), então funciona mesmo
// que os assets com hash do build ainda não estejam em cache.
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/icon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só mesmo domínio + GET. Deixa API e terceiros passarem direto pela rede.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegação (abrir páginas): tenta a rede; se offline, mostra a tela
  // offline autossuficiente (não depende dos assets com hash do build).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r || caches.match("/index.html"))
      )
    );
    return;
  }

  // Estáticos: responde do cache e atualiza por trás.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
