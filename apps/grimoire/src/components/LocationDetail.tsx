'use client';

import { useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    Spinner,
    secondaryButtonClasses,
    useDialogState,
} from '@scheigs/sylva-ui';
import ExportLink from '@/components/ExportLink';
import LocationFormDialog from '@/components/LocationFormDialog';
import MoveCardsDialog from '@/components/MoveCardsDialog';
import { useLocationContents, useUpdateLocation } from '@/lib/queries';
import type { LocationCard } from '@/lib/locations';
import {
    formatLocationSheet,
    locationSheetFilename,
} from '@/lib/locationSheet';
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
    const [moving, setMoving] = useState<LocationCard | null>(null);
    const archive = useDialogState();

    const location = contents.data?.location;
    const sheet = useMemo(
        () =>
            contents.data
                ? formatLocationSheet(
                      contents.data.location,
                      contents.data.cards,
                      new Date()
                  )
                : '',
        [contents.data]
    );
    const sheetUrl = useMemo(
        () =>
            sheet
                ? `data:text/plain;charset=utf-8,${encodeURIComponent(sheet)}`
                : '',
        [sheet]
    );
    const blocker = location ? archiveBlocker(location) : null;
    const archived = location?.archivedAt != null;

    return (
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <a
                href={LOCATIONS_PATH}
                className="text-caption text-text-minimal print:hidden"
            >
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
                    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
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
                        <div className="flex gap-2">
                            <ExportLink
                                href={sheetUrl}
                                filename={locationSheetFilename(location.label)}
                                type="text/plain"
                                className={secondaryButtonClasses}
                            >
                                Download
                            </ExportLink>
                            <Button
                                variant="secondary"
                                onClick={() => window.print()}
                            >
                                Print
                            </Button>
                            {location.kind !== 'unsorted' && (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                    <pre className="hidden whitespace-pre-wrap text-body print:block">
                        {sheet}
                    </pre>
                    {update.isError && !renaming && !archive.open && (
                        <p role="alert" className="text-body text-error">
                            {update.error.message}
                        </p>
                    )}
                    {contents.data.cards.length === 0 ? (
                        <p className="text-body text-text-minimal print:hidden">
                            No cards here.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal print:hidden">
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
                                    <Button
                                        variant="secondary"
                                        aria-label={`Move ${card.name}`}
                                        onClick={() => setMoving(card)}
                                    >
                                        Move
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {moving && (
                        <MoveCardsDialog
                            oracleId={moving.oracleId}
                            name={moving.name}
                            sources={[
                                {
                                    locationId: location.id,
                                    kind: location.kind,
                                    label: location.label,
                                    quantity: moving.quantity,
                                },
                            ]}
                            onClose={() => setMoving(null)}
                        />
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
