(function(){
  'use strict';

  const CACHE_VERSION = 'v1';

  self.addEventListener('install', (event) => {
    console.log('Service worker installing...');

    event.waitUntil(
      caches.open(CACHE_VERSION)
      .then(cache => cache.addAll([
        '/',
        'index.html',
        'main.js',
        'css/style.css',
      ]))
    );
  });

  self.addEventListener('activate', (event) => {
    console.log('Service worker activating...');

    console.log('Clearing old caches');
    caches.keys()
      .then(cacheNames => cacheNames
        .filter(cacheName => cacheName !== CACHE_VERSION)
        .forEach(cacheName => caches.delete(cacheName)));
  });

  self.addEventListener('fetch', (event) => {
    console.log('Fetching: ', event.request.url);

    if (event.request.method !== 'GET')
      return fetch(event.request);

    event.respondWith(
      caches.match(event.request)
      .then(
        response =>
          response
        ||
          fetch(event.request)
            .then(response =>
              caches.open(CACHE_VERSION)
                .then(cache => {
                  console.log('caching: ', event.request);
                  cache.put(event.request, response.clone());
                  return response;
                })
            )
      )
    );
  });

  self.addEventListener('push', (event) => {
    const json = JSON.parse(event.data.text());

    event.waitUntil(
      self.registration.showNotification(json.title, {
        body: json.body,
      })
    );
  });
}());
