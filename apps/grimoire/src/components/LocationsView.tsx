'use client';

import { useState } from 'react';
import { Button, Spinner } from '@scheigs/sylva-ui';
import LocationFormDialog from '@/components/LocationFormDialog';
import { useCreateLocation, useLocations } from '@/lib/queries';
import { cardCountText, groupByKind, locationPath } from '@/lib/locationsPage';

/** The user's locations by kind, with a way to add one. */
export default function LocationsView() {
    const locations = useLocations();
    const create = useCreateLocation();
    const [creating, setCreating] = useState(false);

    const groups = groupByKind(locations.data ?? []);

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-subheading">Locations</h1>
                <Button variant="primary" onClick={() => setCreating(true)}>
                    New location
                </Button>
            </div>
            {locations.isError && (
                <p role="alert" className="text-body text-error">
                    Could not load your locations.
                </p>
            )}
            {locations.isPending && (
                <div className="flex justify-center">
                    <Spinner className="text-text-minimal" />
                </div>
            )}
            {groups.map((group) => (
                <section key={group.kind} className="space-y-2">
                    <h2 className="text-body text-text-minimal">
                        {group.heading}
                    </h2>
                    <ul className="divide-y divide-border-minimal rounded-surface border border-border-minimal">
                        {group.items.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={locationPath(item.id)}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-body">
                                            {item.label}
                                        </span>
                                        {item.note && (
                                            <span className="block truncate text-caption text-text-minimal">
                                                {item.note}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-caption text-text-minimal">
                                        {cardCountText(item.cardCount)}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
            {creating && (
                <LocationFormDialog
                    mode="create"
                    pending={create.isPending}
                    error={create.isError ? create.error.message : null}
                    onSubmit={(values) =>
                        create.mutate(values, {
                            onSuccess: () => setCreating(false),
                        })
                    }
                    onClose={() => {
                        create.reset();
                        setCreating(false);
                    }}
                />
            )}
        </div>
    );
}
