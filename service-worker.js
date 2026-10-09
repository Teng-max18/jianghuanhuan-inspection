/* 发布源码修改时同步修改 VERSION，使离线资源更新。 */
const VERSION = '2.0.1';
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'jianghuanhuan-' + SCOPE + '-';
const CACHE = PREFIX + VERSION;
const FILES = [
    './', './index.html', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
    './assets/style.css', './assets/js/data.js', './assets/js/core.js', './assets/js/storage.js', './assets/js/ui.js', './assets/js/app.js',
    './assets/js/pages/home.js', './assets/js/pages/stores.js', './assets/js/pages/inspections.js', './assets/js/pages/personnel.js', './assets/js/pages/support.js', './assets/js/pages/weekly.js', './assets/js/pages/settings.js'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
})()));
self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        try {
            const response = await fetch(request);
            if (response.ok) await cache.put(request, response.clone());
            return response;
        } catch (_) {
            const cached = await cache.match(request, { ignoreSearch: true });
            if (cached) return cached;
            if (request.mode === 'navigate') return await cache.match('./index.html');
            return new Response('离线资源不可用', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        }
    })());
});
