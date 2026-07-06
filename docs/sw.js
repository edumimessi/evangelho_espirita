// Service worker — cache básico para instalar e abrir offline.
const CACHE = "ese-med-v1";
const CORE = [
  "/meditacao.html",
  "/med-data.js",
  "/manifest.webmanifest",
  "/temas.html",
  "/sermao-da-montanha.html",
  "/parabolas.html",
  "/evangelho-segundo-espiritismo.html",
  "/",
  "/index.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Nunca cacheia a API de texto bíblico nem os comentários externos
  if (url.hostname !== location.hostname) return;
  // Páginas/JS locais: rede primeiro, cache como reserva (offline)
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("/meditacao.html")))
  );
});
