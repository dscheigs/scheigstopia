/** Name prefix shared by every cache the service worker (public/sw.js) makes. */
const CACHE_PREFIX = 'grimoire-';

/** Registers the service worker under the app's base path. Safe to call twice. */
export async function registerServiceWorker(
    scriptPath: string,
    scope: string,
    container: Pick<ServiceWorkerContainer, 'register'> | undefined
): Promise<boolean> {
    if (!container) return false;
    try {
        await container.register(scriptPath, { scope });
        return true;
    } catch {
        return false;
    }
}

/** Empties the offline copies (pages and the collection list) of this app. */
export async function clearOfflineCaches(
    storage: Pick<CacheStorage, 'keys' | 'delete'> | undefined
): Promise<void> {
    if (!storage) return;
    try {
        const names = await storage.keys();
        await Promise.all(
            names
                .filter((name) => name.startsWith(CACHE_PREFIX))
                .map((name) => storage.delete(name))
        );
    } catch {
        // Nothing useful to do: the next sign-in replaces them anyway.
    }
}
