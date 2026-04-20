const CACHE_NAME = 'site-cache-v3';

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

// Установка
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Активация (чистим старые кэши)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
});

// Запросы (умный fallback)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // если есть в кэше — отдаём
      if (response) return response;

      // иначе идём в сеть
      return fetch(event.request)
        .then(networkResponse => {
          // кэшируем новые файлы (например, картинки)
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // если вообще нет сети — можно вернуть index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});