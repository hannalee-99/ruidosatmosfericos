
const CACHE_NAME = 'ruidos-atmosfericos-v4';
const STATIC_ASSETS = [
  '/ruidos_atmosfericos.mp4'
];

// Instalação: Cacheia apenas o que é estático e pesado
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo SW a se tornar ativo imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos para evitar conflitos de versão
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ESTRATÉGIA: NETWORK FIRST para HTML e Dados
  // Garante que o usuário veja sempre o conteúdo mais novo se tiver internet
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)) // Se falhar a rede, usa o cache
    );
    return;
  }

  // ESTRATÉGIA: CACHE FIRST para Mídia e Fontes
  // Imagens e fontes raramente mudam, então priorizamos o carregamento instantâneo
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (
          url.origin === self.location.origin || 
          url.host.includes('cloudinary') || 
          url.host.includes('unsplash') ||
          url.host.includes('gstatic')
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      });
    })
  );
});
