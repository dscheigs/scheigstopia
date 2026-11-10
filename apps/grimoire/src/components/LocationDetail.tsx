'use client';

import { useState } from 'react';
import { Button, Dialog, Spinner, useDialogState } from '@scheigs/sylva-ui';
import LocationFormDialog from '@/components/LocationFormDialog';
import { useLocationContents, useUpdateLocation } from '@/lib/queries';
import {
    LOCATIONS_PATH,
    archiveBlocker,
    cardCountText,
    kindLabel,
} from '@/lib/locationsPage';

/** One location: its cards by name, with rename and archive. */
export default function LocationDetail({ id }: { id: string }) {
    const contents = useLocationContents(id);
    const update = useUpdateLocation();
    const [renaming, setRenaming] = useState(false);
    const archive = useDialogState();

    const location = contents.data?.location;
    const blocker = location ? archiveBlocker(location) : null;
    const archived = location?.archivedAt != null;

    return (
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <a href={LOCATIONS_PATH} className="text-caption text-text-minimal">
                All locations
            </a>
            {contents.isError && (
                <p role="alert" className="text-body text-error">
                    Could not load this location.
                </p>
            )}
            {contents.isPending && (
                <div className="flex justify-center">
                    <Spinner className="text-text-minimal" />
                </div>
            )}
            {location && contents.data && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="truncate text-subheading">
                                {location.label}
                            </h1>
                            <p className="text-caption text-text-minimal">
                                {kindLabel(location.kind)} ·{' '}
                                {cardCountText(location.cardCount)}
                                {archived ? ' · archived' : ''}
                            </p>
                            {location.note && (
                                <p className="text-body text-text-minimal">
                                    {location.note}
                                </p>
                            )}
                        </div>
                        {location.kind !== 'unsorted' && (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setRenaming(true)}
                                >
                                    Rename
                                </Button>
                                {archived ? (
                                    <Button
                                        variant="secondary"
                                        disabled={update.isPending}
                                        onClick={() =>
                                            update.mutate({
                                                id,
                                                archived: false,
                                            })
                                        }
                                    >
                                        Restore
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        onClick={() => archive.show()}
                                    >
                                        Archive
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    {update.isError && !renaming && !archive.open && (
                        <p role="alert" className="text-body text-error">
                            {update.error.message}
                        </p>
                    )}
                    {contents.data.cards.length === 0 ? (
                        <p className="text-body text-text-minimal">
                            No cards here.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal">
                            {contents.data.cards.map((card) => (
                                <li
                                    key={card.oracleId}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <span className="min-w-0 flex-1 truncate text-body">
                                        {card.name}
                                    </span>
                                    <span className="text-body text-text-minimal">
                                        {card.quantity}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {renaming && (
                        <LocationFormDialog
                            mode="rename"
                            initial={{
                                label: location.label,
                                note: location.note,
                            }}
                            pending={update.isPending}
                            error={update.isError ? update.error.message : null}
                            onSubmit={(values) =>
                                update.mutate(
                                    {
                                        id,
                                        label: values.label,
                                        note: values.note,
                                    },
                                    { onSuccess: () => setRenaming(false) }
                                )
                            }
                            onClose={() => {
                                update.reset();
                                setRenaming(false);
                            }}
                        />
                    )}
                    <Dialog
                        open={archive.open}
                        onClose={() => {
                            update.reset();
                            archive.close();
                        }}
                        title="Archive location"
                        secondaryAction={
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    update.reset();
                                    archive.close();
                                }}
                            >
                                Cancel
                            </Button>
                        }
                        primaryAction={
                            <Button
                                variant="primary"
                                disabled={blocker !== null || update.isPending}
                                onClick={() =>
                                    update.mutate(
                                        { id, archived: true },
                                        { onSuccess: () => archive.close() }
                                    )
                                }
                            >
                                Archive
                            </Button>
                        }
                    >
                        <p className="text-body">
                            {blocker ??
                                `Archive ${location.label}? It is hidden from the list and can be restored.`}
                        </p>
                        {update.isError && (
                            <p role="alert" className="text-caption text-error">
                                {update.error.message}
                            </p>
                        )}
                    </Dialog>
                </>
            )}
        </div>
    );
}
