export const COLLECTION_PATH = '/';
export const ADD_PATH = '/add';
/** Opens Add Cards on the queue: `/add?view=queue`. */
export const ADD_QUEUE_URL = `${ADD_PATH}?view=queue`;

export type AddView = 'camera' | 'queue';

/** Which Add Cards view to open on, from the `view` query value. */
export function initialAddView(value: string | null): AddView {
    return value === 'queue' ? 'queue' : 'camera';
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
