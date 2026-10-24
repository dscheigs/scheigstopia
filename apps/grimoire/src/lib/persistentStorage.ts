/**
 * Asks the browser not to evict this site's storage (the scan queue and the
 * cached card list) when the device is low on space. Resolves to whether
 * storage is now persistent; false where the API is missing or refuses.
 */
export async function requestPersistentStorage(
    storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined
): Promise<boolean> {
    if (!storage?.persist) return false;
    try {
        if (await storage.persisted?.()) return true;
        return await storage.persist();
    } catch {
        return false;
    }
}
