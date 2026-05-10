const CACHE_STATIC = 'cmw-checklist-static-v5';
const CACHE_API = 'cmw-checklist-api-v1';

const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './image.png',
  './icon-192.png',
  './icon-512.png',
  'https://static.wixstatic.com/media/a3f80f_20de4807aaad498983ad218c6c56bdd1~mv2.png/v1/fill/w_128,h_44,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/LOGO%202.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando service worker...');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(async cache => {
        console.log('[SW] Cacheando arquivos estáticos');
        // Cacheia cada arquivo individualmente para não falhar todo o processo se um falhar
        const promises = STATIC_FILES.map(file => {
          return cache.add(file).catch(err => {
            console.warn('[SW] Falha ao cachear:', file, err);
          });
        });
        await Promise.all(promises);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Ativando service worker...');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_STATIC && key !== CACHE_API)
            .map(key => {
              console.log('[SW] Removendo cache antigo:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // POST para checklist: tenta enviar, não usa cache
  if (request.method === 'POST' && url.pathname.includes('/checklist')) {
    event.respondWith(handleChecklistPOST(request));
    return;
  }

  // API/Webhook GET: Network First
  if (url.pathname.includes('/checklist-') || url.pathname.includes('/validar-')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Arquivos estáticos: Cache First
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    // Atualiza cache em background (stale-while-revalidate)
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_STATIC).then(cache => cache.put(request, response));
      }
    }).catch(() => {});

    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Se for requisição HTML, retorna página offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('./index.html');
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_API);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Rede indisponível, tentando cache:', request.url);

    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Para requisições GET que falharam e não têm cache
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ erro: 'offline', mensagem: 'Sem conexão com a internet.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw error;
  }
}

async function handleChecklistPOST(request) {
  try {
    // Tenta enviar para a rede
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      return networkResponse;
    } else {
      return networkResponse; // Retorna erro do servidor (ex: 400, 500)
    }
  } catch (error) {
    console.log('[SW] Erro ao enviar checklist (offline?):', error);

    // Retorna resposta indicando que o frontend deve salvar localmente
    return new Response(
      JSON.stringify({
        offline: true,
        mensagem: 'Sem conexão. O checklist foi salvo localmente e será sincronizado automaticamente.',
        timestamp: new Date().toISOString(),
        dever_sincronizar: true
      }),
      {
        status: 202, // Accepted (processado mas não confirmado)
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background Sync (futuro)
self.addEventListener('sync', event => {
  console.log('[SW] Evento sync:', event.tag);
  if (event.tag === 'sync-pendentes') {
    event.waitUntil(sincronizarPendentes());
  }
});

async function sincronizarPendentes() {
  console.log('[SW] Sincronizando pendentes...');
  // TODO: Implementar lógica de sync no service worker se necessário
}

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Novo checklist crítico recebido',
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
          { action: 'view', title: 'Visualizar' },
          { action: 'dismiss', title: 'Ignorar' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(
          data.title || 'CMW Transportes',
          options
        )
      );
    } catch (e) {
      console.error('[SW] Erro ao processar push:', e);
    }
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url.includes('index.html') && 'focus' in client) {
              return client.focus();
            }
          }
          return clients.openWindow('./');
        })
    );
  }
});
