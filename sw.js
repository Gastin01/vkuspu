const CACHE_NAME = 'site-cache-v4';

const urlsToCache = [
  '/',
  '/index.html',
  '/science.html',
  '/resourses.html',
  '/contacts.html',
  '/style.css',

  // картинки
  '/logo.png',
  '/myphoto.jpg',
  '/email-logo.png',
  '/vk-logo.webp',
  '/elibrary-logo.png',
  '/telegram-logo.png',
  '/max-logo.png',
  '/yadisk-logo.png'
];

// файлы, для которых всегда сначала идём в сеть (чтобы правки в CSS/HTML/JS
// были видны сразу, без ручного повышения версии кэша)
const NETWORK_FIRST_EXTENSIONS = ['.html', '.css', '.js'];

function isNetworkFirst(url) {
  const path = new URL(url).pathname;
  return path === '/' || NETWORK_FIRST_EXTENSIONS.some(ext => path.endsWith(ext));
}

// Установка — сразу активируем новую версию, не дожидаясь закрытия вкладок
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Активация — чистим старые кэши и берём под контроль уже открытые вкладки
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Запросы
self.addEventListener('fetch', event => {
  const request = event.request;

  if (isNetworkFirst(request.url)) {
    // network-first: сначала сеть (свежая версия), при неудаче — кэш
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // остальное (картинки и т.п.) — как раньше, cache-first
  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;
      return fetch(request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
