import { useLayoutEffect, type RefObject } from 'react';

/**
 * Publishes the height of a sticky block as `--sticky-controls-height` on the
 * page, which sylva-ui adds to `scroll-padding-top`. A row that takes focus or
 * is scrolled into view then lands below the header and the block, not behind
 * them. The variable is removed when the block unmounts.
 */
export function useStickyOffset(ref: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const root = document.documentElement;
        const publish = () =>
            root.style.setProperty(
                '--sticky-controls-height',
                `${element.getBoundingClientRect().height}px`
            );
        publish();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', publish);
            return () => {
                window.removeEventListener('resize', publish);
                root.style.removeProperty('--sticky-controls-height');
            };
        }
        const observer = new ResizeObserver(publish);
        observer.observe(element);
        return () => {
            observer.disconnect();
            root.style.removeProperty('--sticky-controls-height');
        };
    }, [ref]);
}
