'use client';

import { Button } from '@scheigs/sylva-ui';
import { useRecentMoves, useUndoMove } from '@/lib/queries';
import { recentMoveText } from '@/lib/moveForm';
import { formatMoveDate } from '@/lib/placementText';

/**
 * The latest moves between locations, each with Undo while the cards are still
 * where the move put them. An undo is a move of its own, so it shows up here
 * too. A refused undo is reported by the global toast.
 */
export default function RecentMoves() {
    const recent = useRecentMoves();
    const undo = useUndoMove();

    if (!recent.data || recent.data.length === 0) return null;

    return (
        <section aria-labelledby="recent-moves-heading" className="space-y-2">
            <h2
                id="recent-moves-heading"
                className="text-body text-text-minimal"
            >
                Recent moves
            </h2>
            <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal">
                {recent.data.map((move) => (
                    <li
                        key={move.id}
                        className="flex items-center gap-3 px-4 py-3"
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-body">
                                {recentMoveText(move)}
                            </span>
                            <span className="block truncate text-caption text-text-minimal">
                                {formatMoveDate(move.createdAt)}
                                {move.note ? ` · ${move.note}` : ''}
                            </span>
                        </span>
                        {move.undoable && (
                            <Button
                                variant="secondary"
                                aria-label={`Undo: ${recentMoveText(move)}`}
                                disabled={undo.isPending}
                                onClick={() => undo.mutate(move)}
                            >
                                Undo
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
