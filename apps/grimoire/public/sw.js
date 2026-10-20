// Grimoire's service worker: an offline shell and a last-seen copy of the
// collection list. Plain JavaScript, served as-is from /public.
//
// - Static build files, the icons and the card list: cache first.
// - Page loads and GET /api/collection: network first, falling back to the
//   last copy so the app opens and lists the collection offline.
// - Everything else (identify, writes, auth, export) always goes to the network.
//
// The collection copy is private data, so the page empties these caches on the
// sign-in page (see ClearOfflineCache). Bump VERSION to drop old caches.

const VERSION = 'v1';
const STATIC_CACHE = `grimoire-static-${VERSION}`;
const PAGES_CACHE = `grimoire-pages-${VERSION}`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

function isStaticAsset(path) {
    return (
        path.startsWith(`${SCOPE_PATH}/_next/static/`) ||
        path.startsWith(`${SCOPE_PATH}/icons/`) ||
        path === `${SCOPE_PATH}/data/card-names.json`
    );
}

function isCachedApi(path) {
    return path === `${SCOPE_PATH}/api/collection`;
}

async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}

async function networkFirst(request) {
    const cache = await caches.open(PAGES_CACHE);
    try {
        const response = await fetch(request);
        // Only real answers are kept: not redirects to sign in, not errors.
        if (response.ok && !response.redirected) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const hit = await cache.match(request);
        if (hit) return hit;
        throw error;
    }
}

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keep = [STATIC_CACHE, PAGES_CACHE];
            const names = await caches.keys();
            await Promise.all(
                names
                    .filter(
                        (name) =>
                            name.startsWith('grimoire-') && !keep.includes(name)
                    )
                    .map((name) => caches.delete(name))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate' || isCachedApi(url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
    }
});

// The page asks for the private copies to be dropped when you sign out.
self.addEventListener('message', (event) => {
    if (event.data === 'clear-private-caches') {
        event.waitUntil(caches.delete(PAGES_CACHE));
    }
});
