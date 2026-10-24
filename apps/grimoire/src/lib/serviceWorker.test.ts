import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

// Runs public/sw.js in a sandbox with fake caches and drives its fetch handler,
// the way the browser would.

const ORIGIN = 'https://grimoire.test';
const source = readFileSync(
    new URL('../../public/sw.js', import.meta.url),
    'utf8'
);

type RequestLike = { method: string; url: string; mode: string };
type FetchEventLike = {
    request: RequestLike;
    respondWith: (response: Promise<Response>) => void;
};
type FetchFn = (request: RequestLike) => Promise<Response>;

function keyOf(request: RequestLike | string): string {
    return new URL(typeof request === 'string' ? request : request.url, ORIGIN)
        .href;
}

function loadWorker(scope: string, fetchImpl: FetchFn) {
    const stores = new Map<string, Map<string, Response>>();
    const listeners = new Map<string, (event: never) => void>();

    const caches = {
        async open(name: string) {
            const store = stores.get(name) ?? new Map<string, Response>();
            stores.set(name, store);
            return {
                async match(request: RequestLike | string) {
                    return store.get(keyOf(request))?.clone();
                },
                async put(request: RequestLike, response: Response) {
                    store.set(keyOf(request), response);
                },
            };
        },
        async keys() {
            return [...stores.keys()];
        },
        async delete(name: string) {
            return stores.delete(name);
        },
    };

    const self = {
        registration: { scope: `${ORIGIN}${scope}` },
        location: { origin: ORIGIN },
        clients: { claim: async () => undefined },
        skipWaiting: () => undefined,
        addEventListener(type: string, listener: (event: never) => void) {
            listeners.set(type, listener);
        },
    };

    vm.runInNewContext(source, {
        self,
        caches,
        fetch: fetchImpl,
        Response,
        URL,
    });

    /** What the worker answers for a request, or undefined if it steps aside. */
    function request(
        path: string,
        { mode = 'navigate', method = 'GET' } = {}
    ): Promise<Response> | undefined {
        let answer: Promise<Response> | undefined;
        const event: FetchEventLike = {
            request: { method, url: `${ORIGIN}${path}`, mode },
            respondWith(response) {
                answer = response;
            },
        };
        listeners.get('fetch')?.(event as never);
        return answer;
    }

    return { request, stores };
}

function html(body: string): Response {
    return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
}

function redirected(body: string): Response {
    const response = html(body);
    Object.defineProperty(response, 'redirected', { value: true });
    return response;
}

const offline: FetchFn = async () => {
    throw new TypeError('Load failed');
};

describe('service worker, mounted at /grimoire', () => {
    const scope = '/grimoire';

    function online(pages: Record<string, () => Response>): FetchFn {
        return async (request) => {
            const path = new URL(request.url).pathname;
            const page = pages[path];
            if (!page) throw new TypeError('Load failed');
            return page();
        };
    }

    // The same worker, first online and then without a connection.
    function goesOffline(pages: Record<string, () => Response>) {
        let network: FetchFn = online(pages);
        const worker = loadWorker(scope, (request) => network(request));
        return {
            worker,
            goOffline: () => {
                network = offline;
            },
        };
    }

    it('saves the home page and serves it offline', async () => {
        const { worker, goOffline } = goesOffline({
            '/grimoire': () => html('collection'),
        });
        await worker.request('/grimoire');
        goOffline();
        const response = await worker.request('/grimoire');
        expect(await response?.text()).toBe('collection');
    });

    it('serves the saved home page for a start URL with a trailing slash', async () => {
        const { worker, goOffline } = goesOffline({
            '/grimoire': () => html('collection'),
        });
        await worker.request('/grimoire');
        goOffline();
        const response = await worker.request('/grimoire/');
        expect(response).toBeDefined();
        expect(await (await response)?.text()).toBe('collection');
    });

    it('does not save an answer that was reached by a redirect', async () => {
        const { worker, goOffline } = goesOffline({
            '/grimoire': () => redirected('sign in page'),
        });
        await worker.request('/grimoire');
        goOffline();
        const response = await worker.request('/grimoire');
        expect(response && (await response).status).toBe(503);
    });

    it('answers a page it never saved with an offline page, not an error', async () => {
        const { worker, goOffline } = goesOffline({});
        goOffline();
        const response = await worker.request('/grimoire/add');
        expect(response).toBeDefined();
        const answered = await response;
        expect(answered?.status).toBe(503);
        expect(answered?.headers.get('Content-Type')).toContain('text/html');
        const body = await answered?.text();
        expect(body).toContain('You are offline');
        expect(body).toContain('href="/grimoire"');
    });

    it('does not put another page in place of one it has not saved', async () => {
        const { worker, goOffline } = goesOffline({
            '/grimoire': () => html('collection'),
        });
        await worker.request('/grimoire');
        goOffline();
        const answered = await worker.request('/grimoire/add');
        expect(answered && (await answered).status).toBe(503);
    });

    it('prefers the network and updates the saved copy when online', async () => {
        let version = 'one';
        const worker = loadWorker(scope, async () => html(version));
        await worker.request('/grimoire');
        version = 'two';
        expect(await (await worker.request('/grimoire'))?.text()).toBe('two');
    });

    it('keeps a saved collection list for offline use', async () => {
        const { worker, goOffline } = goesOffline({
            '/grimoire/api/collection': () => html('[{"name":"Sol Ring"}]'),
        });
        await worker.request('/grimoire/api/collection', { mode: 'cors' });
        goOffline();
        const response = await worker.request('/grimoire/api/collection', {
            mode: 'cors',
        });
        expect(await response?.text()).toBe('[{"name":"Sol Ring"}]');
    });

    it('lets a failed collection request fail when nothing is saved', async () => {
        const { worker, goOffline } = goesOffline({});
        goOffline();
        const answer = worker.request('/grimoire/api/collection', {
            mode: 'cors',
        });
        await expect(answer).rejects.toThrow('Load failed');
    });

    it.each([
        [
            'an export download link',
            '/grimoire/api/export?format=csv',
            'navigate',
        ],
        ['the plain text export', '/grimoire/api/export', 'navigate'],
        [
            'a sign-in callback',
            '/grimoire/api/auth/callback/github',
            'navigate',
        ],
        ['a fetch to identify', '/grimoire/api/identify', 'cors'],
    ])('steps aside for %s', (_name, path, mode) => {
        const { worker } = goesOffline({});
        expect(worker.request(path, { mode })).toBeUndefined();
    });

    it('steps aside for writes', () => {
        const { worker } = goesOffline({});
        expect(
            worker.request('/grimoire/api/collection', {
                mode: 'cors',
                method: 'PUT',
            })
        ).toBeUndefined();
    });

    it('serves build files from the saved copy first', async () => {
        let hits = 0;
        const worker = loadWorker(scope, async () => {
            hits += 1;
            return new Response('chunk');
        });
        const path = '/grimoire/_next/static/chunks/app.js';
        await worker.request(path, { mode: 'no-cors' });
        await worker.request(path, { mode: 'no-cors' });
        expect(hits).toBe(1);
    });

    it('leaves other requests alone', () => {
        const worker = loadWorker(scope, offline);
        expect(
            worker.request('/grimoire/something.json', { mode: 'cors' })
        ).toBeUndefined();
    });
});

describe('service worker, standalone at /', () => {
    it('serves the saved home page offline', async () => {
        let network: FetchFn = async () => html('collection');
        const worker = loadWorker('/', (request) => network(request));
        await worker.request('/');
        network = offline;
        expect(await (await worker.request('/'))?.text()).toBe('collection');
    });

    it('answers an unsaved page with the offline page that links home', async () => {
        const worker = loadWorker('/', offline);
        const answered = await worker.request('/add');
        expect(answered && (await answered).status).toBe(503);
        expect(await (await worker.request('/add'))?.text()).toContain(
            'href="/"'
        );
    });

    it('steps aside for the export download', () => {
        const worker = loadWorker('/', offline);
        expect(
            worker.request('/api/export?format=csv', { mode: 'navigate' })
        ).toBeUndefined();
    });
});
