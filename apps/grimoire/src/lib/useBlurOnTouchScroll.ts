import { useEffect, type RefObject } from 'react';

/** How far a finger must travel before it counts as a scroll, not a tap. */
const SCROLL_THRESHOLD_PX = 10;

/**
 * Blurs a field when the user scrolls the page by touch while it has focus.
 * Scrolling a long list should put the keyboard away, and in an installed iOS
 * app it also matters: a focused field leaves the visual viewport offset from
 * the layout viewport, so sticky elements sit in the wrong place until the
 * field loses focus. A drag that starts in the field itself (moving the
 * caret) is left alone, and so is the mouse wheel, so typing at a desktop is
 * never interrupted.
 */
export function useBlurOnTouchScroll(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        let startY: number | null = null;

        const onStart = (event: TouchEvent) => {
            const field = ref.current;
            const target = event.target;
            const inField =
                field && target instanceof Node && field.contains(target);
            startY = inField ? null : (event.touches[0]?.clientY ?? null);
        };
        const onMove = (event: TouchEvent) => {
            const field = ref.current;
            const y = event.touches[0]?.clientY;
            if (
                startY === null ||
                y === undefined ||
                !field ||
                document.activeElement !== field
            ) {
                return;
            }
            if (Math.abs(y - startY) > SCROLL_THRESHOLD_PX) {
                field.blur();
                startY = null;
            }
        };
        const onEnd = () => {
            startY = null;
        };

        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd, { passive: true });
        window.addEventListener('touchcancel', onEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onStart);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };
    }, [ref]);
}
