// Getting an export out of the installed app. A download link works in a
// browser tab, but in an installed iPhone app it opens a file preview that has
// no way back, so the app has to be relaunched. The system share sheet can be
// dismissed and leaves the app where it was, so the installed app uses that.

export type ShareResult = 'shared' | 'cancelled' | 'failed';

type ShareNavigator = {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data?: ShareData) => boolean;
    standalone?: boolean;
};

/** True when running as an installed app (home screen), not in a browser tab. */
export function isStandaloneApp(
    matchMedia: ((query: string) => { matches: boolean }) | undefined,
    nav: ShareNavigator | undefined
): boolean {
    return (
        nav?.standalone === true ||
        matchMedia?.('(display-mode: standalone)').matches === true
    );
}

/** Whether this browser can hand a file of `type` to the system share sheet. */
export function canShareFile(
    nav: ShareNavigator | undefined,
    type: string
): boolean {
    if (!nav?.share || !nav.canShare) return false;
    try {
        return nav.canShare({ files: [new File([''], 'export', { type })] });
    } catch {
        return false;
    }
}

/**
 * Fetches the export and offers it to the share sheet. `cancelled` means the
 * person closed the sheet, which is fine. `failed` means nothing was shared and
 * the caller should fall back to a plain download.
 */
export async function shareExportFile({
    url,
    filename,
    type,
    nav,
    fetchFn = fetch,
}: {
    url: string;
    filename: string;
    type: string;
    nav: ShareNavigator;
    fetchFn?: typeof fetch;
}): Promise<ShareResult> {
    try {
        const response = await fetchFn(url);
        if (!response.ok || !nav.share) return 'failed';
        const file = new File([await response.blob()], filename, { type });
        await nav.share({ files: [file], title: filename });
        return 'shared';
    } catch (error) {
        return error instanceof Error && error.name === 'AbortError'
            ? 'cancelled'
            : 'failed';
    }
}
