export const COLLECTION_PATH = '/';
export const ADD_PATH = '/add';
export const ADD_QUEUE_PATH = '/add/queue';

/** True when `pathname` is the queue review screen under Add Cards. */
export function isQueueRoute(pathname: string | null): boolean {
    return pathname === ADD_QUEUE_PATH || pathname === `${ADD_QUEUE_PATH}/`;
}

/** True when `pathname` is Add Cards or anything beneath it. */
export function isAddRoute(pathname: string | null): boolean {
    return (
        pathname !== null &&
        (pathname === ADD_PATH || pathname.startsWith(`${ADD_PATH}/`))
    );
}

export type VideoPlacement = 'inline' | 'offscreen' | 'hidden';

/**
 * Where the camera video sits. Off-screen (not display none) while the queue
 * is shown, because some mobile browsers stop updating a display:none video.
 */
export function videoPlacement(
    cameraOn: boolean,
    showCamera: boolean
): VideoPlacement {
    if (!cameraOn) return 'hidden';
    return showCamera ? 'inline' : 'offscreen';
}
