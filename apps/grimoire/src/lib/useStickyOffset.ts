import { useLayoutEffect, type RefObject } from 'react';

/**
 * Publishes the height of a sticky block as a CSS variable on the page
 * (`--sticky-controls-height` unless another name is given). sylva-ui adds the
 * variables to `scroll-padding-top`, so a row that takes focus or is scrolled
 * into view lands below the header and the sticky blocks, not behind them.
 * The variable is removed when the block unmounts.
 */
export function useStickyOffset(
    ref: RefObject<HTMLElement | null>,
    variable:
        | '--sticky-controls-height'
        | '--sticky-heading-height' = '--sticky-controls-height'
) {
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const root = document.documentElement;
        const publish = () =>
            root.style.setProperty(
                variable,
                `${element.getBoundingClientRect().height}px`
            );
        publish();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', publish);
            return () => {
                window.removeEventListener('resize', publish);
                root.style.removeProperty(variable);
            };
        }
        const observer = new ResizeObserver(publish);
        observer.observe(element);
        return () => {
            observer.disconnect();
            root.style.removeProperty(variable);
        };
    }, [ref, variable]);
}
