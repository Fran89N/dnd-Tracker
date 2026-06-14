// ============================================================
// service-worker.js  —  D&D Tracker PWA
// Strategia: Cache-First per i file dell'app, Network per il resto
// ============================================================

const CACHE_NAME = 'dnd-tracker-v1';

// File da mettere subito in cache all'installazione
const FILES_TO_CACHE = [
  './dnd-tracker.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ---- INSTALL: scarica e metti in cache tutti i file dell'app ----
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      // Usiamo addAll: se anche un solo file manca, l'install fallisce
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Forza l'attivazione senza aspettare che le vecchie tab vengano chiuse
  self.skipWaiting();
});

// ---- ACTIVATE: elimina cache vecchie ----
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Rimuovo cache vecchia:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  // Prende controllo di tutte le tab aperte immediatamente
  self.clients.claim();
});

// ---- FETCH: serve dalla cache, poi dal network come fallback ----
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Trovato in cache → restituisci subito (funziona offline)
        return cachedResponse;
      }
      // Non in cache → prova il network
      return fetch(event.request).catch(() => {
        // Rete non disponibile e non in cache: mostra la pagina principale
        return caches.match('./dnd-tracker.html');
      });
    })
  );
});
