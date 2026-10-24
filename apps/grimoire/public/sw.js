// Grimoire's service worker: an offline shell and a last-seen copy of the
// collection list. Plain JavaScript, served as-is from /public.
//
// - Static build files, the icons and the card list: cache first.
// - Page loads and GET /api/collection: network first, falling back to the
//   last copy so the app opens and lists the collection offline. A page that
//   was never saved gets a small offline page, not the browser's error.
// - Everything else (identify, writes, auth, export) always goes to the network.
//
// The collection copy is private data, so the page empties these caches on the
// sign-in page (see ClearOfflineCache). Bump VERSION to drop old caches.

const VERSION = 'v1';
const STATIC_CACHE = `grimoire-static-${VERSION}`;
const PAGES_CACHE = `grimoire-pages-${VERSION}`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
// The app's home page: the base path itself (Next redirects `/grimoire/` to it).
const START_PATH = SCOPE_PATH || '/';

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Offline - Grimoire</title>
</head>
<body>
<h1>You are offline</h1>
<p>Grimoire cannot reach the network and has not saved this page.</p>
<p><a href="${START_PATH}">Back to your collection</a></p>
</body>
</html>`;

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

function isApiPath(path) {
    return path.startsWith(`${SCOPE_PATH}/api/`);
}

function isStartPage(path) {
    return path.replace(/\/$/, '') === SCOPE_PATH;
}

function offlinePage() {
    return new Response(OFFLINE_HTML, {
        status: 503,
        statusText: 'Offline',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
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
        const options = { ignoreVary: true };
        const hit = await cache.match(request, options);
        if (hit) return hit;
        if (request.mode !== 'navigate') throw error;
        // The home page may be asked for with a trailing slash (an older
        // install's start URL); it is saved under the base path itself.
        const start = isStartPage(new URL(request.url).pathname)
            ? await cache.match(START_PATH, options)
            : undefined;
        return start || offlinePage();
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

    if (isCachedApi(url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (isApiPath(url.pathname)) {
        // Auth, identify, export and writes: never kept, never served stale.
        // This includes a download link, which the browser opens as a navigation.
        return;
    } else if (request.mode === 'navigate') {
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
