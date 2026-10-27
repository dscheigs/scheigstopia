'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight } from '@scheigs/sylva-ui';
import CardThumbnail from '@/components/CardThumbnail';
import type { CollectionItem } from '@/lib/collection';

/**
 * A row's height in rem, used only until the row has been measured. Rows are
 * one layout at every width (thumbnail, a one-line name and a quantity
 * badge), so the estimate is close and the measurement a formality. It is
 * in rem, not pixels, so it follows the user's text size.
 */
const ROW_ESTIMATE_REM = 5.5;

/** Rows kept mounted beyond the visible ones, so a fast scroll does not flash. */
const OVERSCAN = 8;

function rootFontSize(): number {
    const size = parseFloat(
        getComputedStyle(document.documentElement).fontSize
    );
    return Number.isFinite(size) && size > 0 ? size : 16;
}

type CollectionListProps = {
    items: CollectionItem[];
    /** oracleId -> Scryfall image id; empty until the card list loads. */
    imageIds: Map<string, string>;
    /** Called when a row is activated; the caller shows the card's detail. */
    onOpen: (item: CollectionItem) => void;
};

/**
 * The collection as a list that mounts only the rows near the viewport, so it
 * stays fast with thousands of cards. The page scrolls (not an inner box), so
 * it uses the window virtualizer. It stays a real `ul` of `li`s: because most
 * rows are not in the DOM, each row says its place and the list's size
 * (`aria-posinset` / `aria-setsize`) so assistive tech still hears "3 of 2,400".
 * Each row is one button that opens the card's detail; editing lives there.
 */
export default function CollectionList({
    items,
    imageIds,
    onOpen,
}: CollectionListProps) {
    const listRef = useRef<HTMLUListElement>(null);
    // Distance from the top of the page to the top of the list. Nothing above
    // the list changes height while it is mounted, so measuring on mount and on
    // resize is enough.
    const [scrollMargin, setScrollMargin] = useState(0);

    useLayoutEffect(() => {
        const measure = () => {
            const list = listRef.current;
            if (!list) return;
            setScrollMargin(list.getBoundingClientRect().top + window.scrollY);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const virtualizer = useWindowVirtualizer({
        count: items.length,
        estimateSize: () => ROW_ESTIMATE_REM * rootFontSize(),
        overscan: OVERSCAN,
        scrollMargin,
        getItemKey: (index) => items[index].oracleId,
    });

    return (
        <ul
            ref={listRef}
            className="relative overflow-hidden rounded-surface border border-border-minimal bg-surface-minimal"
            style={{ height: virtualizer.getTotalSize() }}
        >
            {virtualizer.getVirtualItems().map((row) => {
                const item = items[row.index];
                return (
                    <li
                        key={row.key}
                        ref={virtualizer.measureElement}
                        data-index={row.index}
                        aria-posinset={row.index + 1}
                        aria-setsize={items.length}
                        className={`absolute left-0 top-0 w-full ${
                            row.index > 0
                                ? 'border-t border-border-minimal'
                                : ''
                        }`}
                        style={{
                            transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                        }}
                    >
                        <button
                            type="button"
                            aria-haspopup="dialog"
                            aria-label={`${item.name}, ${item.quantity} owned`}
                            onClick={() => onOpen(item)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-minimal-hover active:bg-surface-minimal-hover"
                        >
                            <CardThumbnail
                                imageId={imageIds.get(item.oracleId)}
                                name={item.name}
                                interactive={false}
                            />
                            <span
                                className="min-w-0 flex-1 truncate text-body"
                                title={item.name}
                            >
                                {item.name}
                            </span>
                            <span
                                aria-hidden="true"
                                className="shrink-0 rounded-button border border-border-minimal px-2 text-caption"
                            >
                                ×{item.quantity}
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="shrink-0 text-text-minimal"
                            />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
