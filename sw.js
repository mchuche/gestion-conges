// Service Worker pour le Gestionnaire de Congés
// Version du cache - incrémenter pour forcer la mise à jour
const CACHE_NAME = 'gestion-conges-v1';
const RUNTIME_CACHE = 'gestion-conges-runtime-v1';

// Fichiers à mettre en cache lors de l'installation
// Utiliser des chemins relatifs pour compatibilité avec GitHub Pages
const STATIC_CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/supabase-init.js',
  './js/utils.js',
  './js/holidays.js',
  './js/database.js',
  './js/auth.js',
  './js/calendar.js',
  './js/stats.js',
  './js/modals.js',
  './js/config.js',
  './js/leaveManager.js',
  './js/pwa.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Installer le service worker et mettre en cache les fichiers statiques
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers statiques');
        // Ne pas bloquer l'installation si certains fichiers échouent
        return Promise.allSettled(
          STATIC_CACHE_FILES.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn(`[Service Worker] Échec du cache pour ${url}:`, err);
              });
          })
        );
      })
      .then(() => {
        // Forcer l'activation immédiate du nouveau service worker
        return self.skipWaiting();
      })
  );
});

// Activer le service worker et nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Supprimer les anciens caches
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Prendre le contrôle de toutes les pages immédiatement
        return self.clients.claim();
      })
  );
});

// Intercepter les requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes vers Supabase (API) - toujours aller en ligne
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // En cas d'erreur réseau, retourner une réponse d'erreur
          return new Response(
            JSON.stringify({ error: 'Hors ligne - Impossible de se connecter à Supabase' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Pour les autres requêtes, stratégie Cache First avec fallback réseau
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Si trouvé dans le cache, retourner la version en cache
        if (cachedResponse) {
          return cachedResponse;
        }

        // Sinon, aller chercher sur le réseau
        return fetch(request)
          .then((response) => {
            // Vérifier que la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();

            // Mettre en cache dans le cache runtime
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si hors ligne et fichier HTML demandé, retourner index.html
            if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html') || caches.match('/index.html');
            }
            // Sinon, retourner une réponse d'erreur générique
            return new Response('Hors ligne', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Écouter les messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    // Mettre en cache des URLs supplémentaires
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return Promise.all(
            event.data.urls.map((url) => {
              return fetch(url)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch((err) => {
                  console.warn(`[Service Worker] Échec du cache pour ${url}:`, err);
                });
            })
          );
        })
    );
  }
});

