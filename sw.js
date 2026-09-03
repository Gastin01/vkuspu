javascript
const CACHE_NAME = 'site-cache-v6.6.2wl';

const urlsToCache = [
  '/',

  // Страницы
  '/index.html',
  '/science.html',
  '/resourses.html',
  '/contacts.html',
  '/lwm.html',

  // Стили и скрипты
  '/style.css',
  '/papers-data.js',

  // Фотографии
  '/assets/images/myphoto.jpg',

  // Логотипы
  '/assets/logos/logo-light.png',
  '/assets/logos/logo-dark.png',
  '/assets/logos/email-logo.png',
  '/assets/logos/vk-logo.webp',
  '/assets/logos/elibrary-logo.png',
  '/assets/logos/telegram-logo.png',
  '/assets/logos/max-logo.png',
  '/assets/logos/orcid-logo.png',
  '/assets/logos/github-logo.png',
  '/assets/logos/yadisk-logo.png',

  // Иконки
  '/assets/icons/favicon.ico',
  '/assets/icons/apple-icon-180.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',

  // Фоновые паттерны
  '/assets/patterns/pattern-light-purple.jpg',
  '/assets/patterns/pattern-light-orange.jpg',
  '/assets/patterns/pattern-light-ocean.jpg',
  '/assets/patterns/pattern-light-emerald.jpg',
  '/assets/patterns/pattern-light-rose.jpg'
];


// Файлы, для которых всегда сначала идём в сеть,
// чтобы изменения HTML / CSS / JS сразу были видны.
const NETWORK_FIRST_EXTENSIONS = ['.html', '.css', '.js'];

function isNetworkFirst(url) {
  const path = new URL(url).pathname;

  return (
    path === '/' ||
    NETWORK_FIRST_EXTENSIONS.some(ext => path.endsWith(ext))
  );
}


// Установка новой версии Service Worker
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});


// Активация — удаляем старые кэши
// и сразу берём под контроль открытые страницы.
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


// Обработка запросов
self.addEventListener('fetch', event => {
  const request = event.request;

  if (isNetworkFirst(request.url)) {

    // HTML / CSS / JS:
    // сначала пытаемся получить свежую версию из сети,
    // при отсутствии сети используем кэш.
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone);
          });

          return networkResponse;
        })
        .catch(() =>
          caches.match(request)
            .then(cached =>
              cached || caches.match('/index.html')
            )
        )
    );

    return;
  }


  // Изображения и остальные ресурсы:
  // сначала используем кэш, если ресурс уже сохранён.
  event.respondWith(
    caches.match(request)
      .then(response => {

        if (response) {
          return response;
        }

        return fetch(request)
          .then(networkResponse => {

            return caches.open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  request,
                  networkResponse.clone()
                );

                return networkResponse;
              });
          });
      })
  );
});
